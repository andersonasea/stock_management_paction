"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { ActionState } from "@/lib/actions/stock";
import type { Prisma } from "@prisma/client";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    throw new Error("Accès refusé");
  }
  return session.user;
}

type Tx = Prisma.TransactionClient;

/**
 * Recalcule stock = Σ achats − Σ consommations
 * et CUMP en rejouant les achats chronologiquement.
 */
async function rebuildMaterialStockAndCump(
  tx: Tx,
  rawMaterialId: string
): Promise<{ stockQuantity: number; unitCost: number }> {
  const purchases = await tx.purchase.findMany({
    where: { rawMaterialId },
    orderBy: { createdAt: "asc" },
    select: { quantity: true, unitPrice: true },
  });

  let stockFromPurchases = 0;
  let unitCost = 0;
  for (const p of purchases) {
    const next = stockFromPurchases + p.quantity;
    unitCost =
      next > 0
        ? (stockFromPurchases * unitCost + p.quantity * p.unitPrice) / next
        : p.unitPrice;
    stockFromPurchases = next;
  }

  const consumed = await tx.productionConsumption.aggregate({
    where: { rawMaterialId },
    _sum: { quantity: true },
  });
  const consumedQty = consumed._sum.quantity || 0;
  const stockQuantity = stockFromPurchases - consumedQty;

  await tx.rawMaterial.update({
    where: { id: rawMaterialId },
    data: {
      stockQuantity,
      unitCost: purchases.length > 0 ? unitCost : 0,
    },
  });

  return { stockQuantity, unitCost };
}

function revalidatePurchasePaths(purchaseId?: string) {
  revalidatePath("/admin/purchases");
  revalidatePath("/admin/materials");
  revalidatePath("/admin/stock");
  revalidatePath("/admin/products");
  if (purchaseId) revalidatePath(`/admin/purchases/${purchaseId}`);
}

const materialSchema = z.object({
  name: z.string().min(2),
  unit: z.enum(["L", "KG", "PCS"]),
});

export async function createRawMaterial(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = materialSchema.safeParse({
    name: String(formData.get("name") || "").trim(),
    unit: formData.get("unit"),
  });
  if (!parsed.success) return { error: "Nom et unité requis" };

  try {
    await prisma.rawMaterial.create({ data: parsed.data });
  } catch {
    return { error: "Cette matière existe déjà" };
  }

  revalidatePath("/admin/materials");
  revalidatePath("/admin/purchases");
  revalidatePath("/admin/products");
  return { success: "Matière première créée" };
}

export async function updateRawMaterial(
  materialId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = materialSchema.safeParse({
    name: String(formData.get("name") || "").trim(),
    unit: formData.get("unit"),
  });
  if (!parsed.success) return { error: "Nom et unité requis" };

  const isActive =
    formData.get("isActive") === "on" || formData.get("isActive") === "true";

  try {
    await prisma.rawMaterial.update({
      where: { id: materialId },
      data: { ...parsed.data, isActive },
    });
  } catch {
    return { error: "Impossible de mettre à jour (nom déjà pris ?)" };
  }

  revalidatePath("/admin/materials");
  revalidatePath(`/admin/materials/${materialId}`);
  revalidatePath("/admin/purchases");
  revalidatePath("/admin/stock");
  return { success: "Matière mise à jour" };
}

export async function deleteRawMaterial(materialId: string): Promise<void> {
  await requireAdmin();

  const purchases = await prisma.purchase.count({
    where: { rawMaterialId: materialId },
  });
  const recipeItems = await prisma.productRecipeItem.count({
    where: { rawMaterialId: materialId },
  });
  const consumptions = await prisma.productionConsumption.count({
    where: { rawMaterialId: materialId },
  });

  if (purchases > 0 || recipeItems > 0 || consumptions > 0) {
    await prisma.rawMaterial.update({
      where: { id: materialId },
      data: { isActive: false },
    });
  } else {
    await prisma.rawMaterial.delete({ where: { id: materialId } });
  }

  revalidatePath("/admin/materials");
  revalidatePath("/admin/purchases");
  revalidatePath("/admin/products");
  revalidatePath("/admin/stock");
}

export async function addPurchase(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireAdmin();
  const rawMaterialId = String(formData.get("rawMaterialId") || "");
  const quantity = Number(formData.get("quantity") || 0);
  const unitPrice = Number(formData.get("unitPrice") || 0);
  const supplier = String(formData.get("supplier") || "") || null;
  const note = String(formData.get("note") || "") || null;

  if (!rawMaterialId || quantity <= 0 || unitPrice < 0) {
    return { error: "Matière, quantité et prix requis" };
  }

  const material = await prisma.rawMaterial.findUnique({
    where: { id: rawMaterialId },
  });
  if (!material) return { error: "Matière introuvable" };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.purchase.create({
        data: {
          rawMaterialId,
          quantity,
          unitPrice,
          totalAmount: quantity * unitPrice,
          supplier,
          note,
          createdById: user.id,
        },
      });
      const rebuilt = await rebuildMaterialStockAndCump(tx, rawMaterialId);
      if (rebuilt.stockQuantity < -0.0001) {
        throw new Error("STOCK_NEGATIF");
      }
    });
  } catch (e) {
    if (e instanceof Error && e.message === "STOCK_NEGATIF") {
      return { error: "Stock matière insuffisant après cet achat (incohérence)" };
    }
    return { error: "Échec de l'enregistrement de l'achat" };
  }

  revalidatePurchasePaths();
  return { success: "Achat enregistré — stock et CUMP mis à jour" };
}

export async function updatePurchase(
  purchaseId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const existing = await prisma.purchase.findUnique({
    where: { id: purchaseId },
  });
  if (!existing) return { error: "Achat introuvable" };

  const rawMaterialId = String(formData.get("rawMaterialId") || "");
  const quantity = Number(formData.get("quantity") || 0);
  const unitPrice = Number(formData.get("unitPrice") || 0);
  const supplier = String(formData.get("supplier") || "") || null;
  const note = String(formData.get("note") || "") || null;

  if (!rawMaterialId || quantity <= 0 || unitPrice < 0) {
    return { error: "Matière, quantité et prix requis" };
  }

  const material = await prisma.rawMaterial.findUnique({
    where: { id: rawMaterialId },
  });
  if (!material) return { error: "Matière introuvable" };

  const oldMaterialId = existing.rawMaterialId;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.purchase.update({
        where: { id: purchaseId },
        data: {
          rawMaterialId,
          quantity,
          unitPrice,
          totalAmount: quantity * unitPrice,
          supplier,
          note,
        },
      });

      const rebuilt = await rebuildMaterialStockAndCump(tx, rawMaterialId);
      if (rebuilt.stockQuantity < -0.0001) {
        throw new Error("STOCK_NEGATIF");
      }

      if (oldMaterialId !== rawMaterialId) {
        const rebuiltOld = await rebuildMaterialStockAndCump(tx, oldMaterialId);
        if (rebuiltOld.stockQuantity < -0.0001) {
          throw new Error("STOCK_NEGATIF");
        }
      }
    });
  } catch (e) {
    if (e instanceof Error && e.message === "STOCK_NEGATIF") {
      return {
        error:
          "Modification impossible : le stock matière deviendrait négatif (consommations déjà enregistrées).",
      };
    }
    return { error: "Échec de la mise à jour de l'achat" };
  }

  revalidatePurchasePaths(purchaseId);
  return { success: "Achat mis à jour — stock et CUMP recalculés" };
}

export async function deletePurchase(purchaseId: string): Promise<void> {
  await requireAdmin();

  const existing = await prisma.purchase.findUnique({
    where: { id: purchaseId },
  });
  if (!existing) return;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.purchase.delete({ where: { id: purchaseId } });
      const rebuilt = await rebuildMaterialStockAndCump(
        tx,
        existing.rawMaterialId
      );
      if (rebuilt.stockQuantity < -0.0001) {
        throw new Error("STOCK_NEGATIF");
      }
    });
  } catch (e) {
    if (e instanceof Error && e.message === "STOCK_NEGATIF") {
      // Impossible de supprimer : on ne fait rien (ou on pourrait throw)
      return;
    }
    throw e;
  }

  revalidatePurchasePaths();
  redirect("/admin/purchases");
}

/** Suppression depuis la liste (sans redirect forcé si déjà sur la page) */
export async function deletePurchaseFromList(purchaseId: string): Promise<void> {
  await requireAdmin();

  const existing = await prisma.purchase.findUnique({
    where: { id: purchaseId },
  });
  if (!existing) return;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.purchase.delete({ where: { id: purchaseId } });
      const rebuilt = await rebuildMaterialStockAndCump(
        tx,
        existing.rawMaterialId
      );
      if (rebuilt.stockQuantity < -0.0001) {
        throw new Error("STOCK_NEGATIF");
      }
    });
  } catch (e) {
    if (e instanceof Error && e.message === "STOCK_NEGATIF") {
      return;
    }
    throw e;
  }

  revalidatePurchasePaths();
}

export async function addRecipeItem(
  productId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const rawMaterialId = String(formData.get("rawMaterialId") || "");
  const quantityPerUnit = Number(formData.get("quantityPerUnit") || 0);

  if (!rawMaterialId || quantityPerUnit <= 0) {
    return { error: "Matière et quantité par unité requis" };
  }

  try {
    await prisma.productRecipeItem.create({
      data: { productId, rawMaterialId, quantityPerUnit },
    });
  } catch {
    return { error: "Cette matière est déjà dans la recette" };
  }

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/admin/stock");
  return { success: "Ligne de recette ajoutée" };
}

export async function removeRecipeItem(itemId: string, productId: string) {
  await requireAdmin();
  await prisma.productRecipeItem.delete({ where: { id: itemId } });
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/admin/stock");
}

/** Coût de revient théorique d'après la nomenclature et les CUMP actuels */
export async function computeRecipeUnitCost(productId: string) {
  const items = await prisma.productRecipeItem.findMany({
    where: { productId },
    include: { rawMaterial: true },
  });
  return items.reduce(
    (sum, item) => sum + item.quantityPerUnit * item.rawMaterial.unitCost,
    0
  );
}
