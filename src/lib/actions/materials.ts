"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { ActionState } from "@/lib/actions/stock";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    throw new Error("Accès refusé");
  }
  return session.user;
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

  const [purchases, recipeItems, consumptions] = await Promise.all([
    prisma.purchase.count({ where: { rawMaterialId: materialId } }),
    prisma.productRecipeItem.count({ where: { rawMaterialId: materialId } }),
    prisma.productionConsumption.count({ where: { rawMaterialId: materialId } }),
  ]);

  if (purchases > 0 || recipeItems > 0 || consumptions > 0) {
    // Historique présent → désactivation plutôt que suppression
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
  const supplier = String(formData.get("supplier") || "") || undefined;
  const note = String(formData.get("note") || "") || undefined;

  if (!rawMaterialId || quantity <= 0 || unitPrice < 0) {
    return { error: "Matière, quantité et prix requis" };
  }

  const material = await prisma.rawMaterial.findUnique({
    where: { id: rawMaterialId },
  });
  if (!material) return { error: "Matière introuvable" };

  const totalAmount = quantity * unitPrice;
  const stockBefore = material.stockQuantity;
  const costBefore = material.unitCost;
  const stockAfter = stockBefore + quantity;
  const unitCostAfter =
    stockAfter > 0
      ? (stockBefore * costBefore + quantity * unitPrice) / stockAfter
      : unitPrice;

  await prisma.$transaction([
    prisma.purchase.create({
      data: {
        rawMaterialId,
        quantity,
        unitPrice,
        totalAmount,
        supplier,
        note,
        createdById: user.id,
      },
    }),
    prisma.rawMaterial.update({
      where: { id: rawMaterialId },
      data: {
        stockQuantity: stockAfter,
        unitCost: unitCostAfter,
      },
    }),
  ]);

  revalidatePath("/admin/purchases");
  revalidatePath("/admin/materials");
  revalidatePath("/admin/stock");
  return { success: "Achat enregistré — stock et CUMP mis à jour" };
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
