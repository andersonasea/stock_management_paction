"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/constants";

export type ActionState = { error?: string; success?: string };

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");
  return session.user;
}

async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    throw new Error("Accès refusé");
  }
  return user;
}

async function requireSuperAdmin() {
  const user = await requireUser();
  if (user.role !== "SUPER_ADMIN") throw new Error("Accès refusé");
  return user;
}

const productSchema = z.object({
  name: z.string().min(2),
  saveurId: z.string().min(1),
  formatId: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  unitPrice: z.coerce.number().min(0),
  productionCost: z.coerce.number().min(0),
  stockQuantity: z.coerce.number().int().min(0),
});

export async function createProduct(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireAdmin();
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    saveurId: formData.get("saveurId"),
    formatId: formData.get("formatId"),
    description: formData.get("description") || undefined,
    imageUrl: formData.get("imageUrl") || undefined,
    unitPrice: formData.get("unitPrice"),
    productionCost: formData.get("productionCost"),
    stockQuantity: formData.get("stockQuantity"),
  });

  if (!parsed.success) return { error: "Vérifiez les champs du produit" };

  try {
    await prisma.product.create({
      data: { ...parsed.data, createdById: user.id },
    });
  } catch {
    return { error: "Ce couple saveur/format existe déjà" };
  }

  revalidatePath("/admin/products");
  revalidatePath("/catalogue");
  return { success: "Produit créé" };
}

export async function updateProduct(
  productId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    saveurId: formData.get("saveurId"),
    formatId: formData.get("formatId"),
    description: formData.get("description") || undefined,
    imageUrl: formData.get("imageUrl") || undefined,
    unitPrice: formData.get("unitPrice"),
    productionCost: formData.get("productionCost"),
    stockQuantity: formData.get("stockQuantity"),
  });

  if (!parsed.success) return { error: "Vérifiez les champs du produit" };

  const isActive =
    formData.get("isActive") === "on" || formData.get("isActive") === "true";

  try {
    await prisma.product.update({
      where: { id: productId },
      data: { ...parsed.data, isActive },
    });
  } catch {
    return { error: "Ce couple saveur/format existe déjà" };
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/catalogue");
  return { success: "Produit mis à jour" };
}

export async function deleteProduct(productId: string): Promise<void> {
  await requireAdmin();

  const orderItems = await prisma.orderItem.count({ where: { productId } });

  if (orderItems > 0) {
    await prisma.product.update({
      where: { id: productId },
      data: { isActive: false },
    });
  } else {
    await prisma.$transaction(async (tx) => {
      const productions = await tx.production.findMany({
        where: { productId },
        select: { id: true },
      });
      const productionIds = productions.map((p) => p.id);
      if (productionIds.length > 0) {
        await tx.productionConsumption.deleteMany({
          where: { productionId: { in: productionIds } },
        });
      }
      await tx.production.deleteMany({ where: { productId } });
      await tx.productRecipeItem.deleteMany({ where: { productId } });
      await tx.product.delete({ where: { id: productId } });
    });
  }

  revalidatePath("/admin/products");
  revalidatePath("/catalogue");
  revalidatePath("/admin/stock");
}

export async function addProduction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireAdmin();
  const productId = String(formData.get("productId") || "");
  const quantity = Number(formData.get("quantity") || 0);
  const note = String(formData.get("note") || "") || undefined;

  if (!productId || quantity <= 0) {
    return { error: "Produit et quantité requis" };
  }

  const recipe = await prisma.productRecipeItem.findMany({
    where: { productId },
    include: { rawMaterial: true },
  });

  if (recipe.length === 0) {
    return {
      error:
        "Aucune recette définie pour ce produit. Ajoutez les matières dans la fiche produit.",
    };
  }

  for (const line of recipe) {
    const needed = line.quantityPerUnit * quantity;
    if (line.rawMaterial.stockQuantity < needed) {
      return {
        error: `Stock insuffisant : ${line.rawMaterial.name} (besoin ${needed}, dispo ${line.rawMaterial.stockQuantity})`,
      };
    }
  }

  const unitCost = recipe.reduce(
    (sum, line) => sum + line.quantityPerUnit * line.rawMaterial.unitCost,
    0
  );

  try {
    await prisma.$transaction(async (tx) => {
      const production = await tx.production.create({
        data: {
          productId,
          quantity,
          unitCost,
          note,
          createdById: user.id,
        },
      });

      for (const line of recipe) {
        const consumedQty = line.quantityPerUnit * quantity;
        const lineUnitCost = line.rawMaterial.unitCost;
        await tx.productionConsumption.create({
          data: {
            productionId: production.id,
            rawMaterialId: line.rawMaterialId,
            quantity: consumedQty,
            unitCost: lineUnitCost,
            totalCost: consumedQty * lineUnitCost,
          },
        });
        await tx.rawMaterial.update({
          where: { id: line.rawMaterialId },
          data: { stockQuantity: { decrement: consumedQty } },
        });
      }

      await tx.product.update({
        where: { id: productId },
        data: {
          stockQuantity: { increment: quantity },
          productionCost: unitCost,
        },
      });
    });
  } catch {
    return { error: "Échec de la production (stock matière insuffisant ?)" };
  }

  revalidatePath("/admin/stock");
  revalidatePath("/admin/products");
  revalidatePath("/admin/materials");
  revalidatePath("/catalogue");
  revalidatePath("/admin");
  revalidatePath("/super-admin");
  return {
    success: `Production enregistrée — coût unitaire ${Math.round(unitCost)} CDF`,
  };
}

export async function addCost(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireAdmin();
  const type = String(formData.get("type") || "");
  const label = String(formData.get("label") || "");
  const amount = Number(formData.get("amount") || 0);
  const description = String(formData.get("description") || "") || undefined;

  const allowed = ["DISTRIBUTION", "COMMERCIAL", "ADMINISTRATIVE", "OTHER"];
  if (!allowed.includes(type) || !label || amount <= 0) {
    return { error: "Type, libellé et montant requis" };
  }

  await prisma.cost.create({
    data: {
      type: type as
        | "DISTRIBUTION"
        | "COMMERCIAL"
        | "ADMINISTRATIVE"
        | "OTHER",
      label,
      amount,
      description,
      createdById: user.id,
    },
  });

  revalidatePath("/admin/costs");
  revalidatePath("/admin");
  revalidatePath("/super-admin");
  return { success: "Charge enregistrée" };
}

export async function createOrder(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  if (user.role !== "USER") {
    return { error: "Seuls les clients peuvent commander" };
  }

  const productId = String(formData.get("productId") || "");
  const quantity = Number(formData.get("quantity") || 0);
  const customerPhone = String(formData.get("customerPhone") || "") || undefined;
  const customerAddress =
    String(formData.get("customerAddress") || "") || undefined;
  const notes = String(formData.get("notes") || "") || undefined;

  if (!productId || quantity <= 0) {
    return { error: "Quantité invalide" };
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) {
    return { error: "Produit introuvable" };
  }
  if (product.stockQuantity < quantity) {
    return { error: `Stock insuffisant (dispo: ${product.stockQuantity})` };
  }

  const subtotal = product.unitPrice * quantity;
  await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId: user.id,
      totalAmount: subtotal,
      customerPhone,
      customerAddress,
      notes,
      items: {
        create: {
          productId,
          quantity,
          unitPrice: product.unitPrice,
          productionCost: product.productionCost,
          subtotal,
        },
      },
    },
  });

  revalidatePath("/orders");
  revalidatePath("/admin/orders");
  return { success: "Commande envoyée avec succès" };
}

export async function validateOrder(orderId: string): Promise<void> {
  const user = await requireAdmin();
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order || order.status !== "PENDING") return;

  for (const item of order.items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
    });
    if (!product || product.stockQuantity < item.quantity) return;
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "VALIDATED",
      validatedAt: new Date(),
      validatedById: user.id,
    },
  });

  revalidatePath("/admin/orders");
  revalidatePath("/orders");
  revalidatePath("/super-admin");
}

export async function deliverOrder(orderId: string): Promise<void> {
  const user = await requireAdmin();
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order || order.status !== "VALIDATED") return;

  try {
    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });
        if (!product || product.stockQuantity < item.quantity) {
          throw new Error("Stock insuffisant à la livraison");
        }
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { decrement: item.quantity } },
        });
      }

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "DELIVERED",
          deliveredAt: new Date(),
          deliveredById: user.id,
        },
      });
    });
  } catch {
    return;
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin/stock");
  revalidatePath("/orders");
  revalidatePath("/catalogue");
  revalidatePath("/super-admin");
}

export async function cancelOrder(orderId: string): Promise<void> {
  await requireAdmin();
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status === "DELIVERED") return;

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/admin/orders");
  revalidatePath("/orders");
}

export async function createAdmin(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireSuperAdmin();
  const name = String(formData.get("name") || "");
  const email = String(formData.get("email") || "").toLowerCase();
  const password = String(formData.get("password") || "");
  const phone = String(formData.get("phone") || "") || undefined;

  if (name.length < 2 || !email.includes("@") || password.length < 6) {
    return { error: "Nom, email et mot de passe (6+) requis" };
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { error: "Email déjà utilisé" };

  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: { name, email, phone, passwordHash, role: "ADMIN" },
  });

  revalidatePath("/super-admin/admins");
  return { success: "Admin créé avec succès" };
}

export async function updateAdmin(
  adminId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const current = await requireSuperAdmin();

  const target = await prisma.user.findUnique({ where: { id: adminId } });
  if (!target || (target.role !== "ADMIN" && target.role !== "SUPER_ADMIN")) {
    return { error: "Admin introuvable" };
  }

  const name = String(formData.get("name") || "");
  const email = String(formData.get("email") || "").toLowerCase();
  const phone = String(formData.get("phone") || "") || null;
  const password = String(formData.get("password") || "");

  if (name.length < 2 || !email.includes("@")) {
    return { error: "Nom et email valides requis" };
  }

  if (password && password.length < 6) {
    return { error: "Mot de passe : au moins 6 caractères" };
  }

  const emailTaken = await prisma.user.findFirst({
    where: { email, NOT: { id: adminId } },
  });
  if (emailTaken) return { error: "Cet email est déjà utilisé" };

  // Empêcher de se retirer soi-même le rôle Super Admin
  const roleInput = String(formData.get("role") || target.role);
  let role = target.role;
  if (target.role === "ADMIN" && roleInput === "ADMIN") {
    role = "ADMIN";
  } else if (
    target.role === "SUPER_ADMIN" &&
    roleInput === "ADMIN" &&
    target.id === current.id
  ) {
    return { error: "Vous ne pouvez pas retirer votre propre rôle Super Admin" };
  } else if (target.role === "SUPER_ADMIN" && roleInput === "ADMIN") {
    const superCount = await prisma.user.count({
      where: { role: "SUPER_ADMIN" },
    });
    if (superCount <= 1) {
      return { error: "Impossible : c'est le dernier Super Admin" };
    }
    role = "ADMIN";
  } else if (target.role === "ADMIN" && roleInput === "SUPER_ADMIN") {
    role = "SUPER_ADMIN";
  }

  const data: {
    name: string;
    email: string;
    phone: string | null;
    role: "ADMIN" | "SUPER_ADMIN";
    passwordHash?: string;
  } = { name, email, phone, role };

  if (password) {
    const bcrypt = await import("bcryptjs");
    data.passwordHash = await bcrypt.hash(password, 10);
  }

  await prisma.user.update({ where: { id: adminId }, data });

  revalidatePath("/super-admin/admins");
  revalidatePath(`/super-admin/admins/${adminId}`);
  return { success: "Admin mis à jour" };
}

export async function deleteAdmin(adminId: string): Promise<void> {
  const current = await requireSuperAdmin();

  if (adminId === current.id) {
    return;
  }

  const target = await prisma.user.findUnique({ where: { id: adminId } });
  if (!target) return;

  if (target.role === "SUPER_ADMIN") {
    const superCount = await prisma.user.count({
      where: { role: "SUPER_ADMIN" },
    });
    if (superCount <= 1) return;
  }

  if (target.role !== "ADMIN" && target.role !== "SUPER_ADMIN") {
    return;
  }

  // Les commandes / coûts liés restent via relations : on supprime seulement s'il n'y a pas de dépendances critiques
  // ou on refuse la suppression s'il a créé des données liées.
  const [ordersValidated, costs, productions] = await Promise.all([
    prisma.order.count({
      where: {
        OR: [{ validatedById: adminId }, { deliveredById: adminId }],
      },
    }),
    prisma.cost.count({ where: { createdById: adminId } }),
    prisma.production.count({ where: { createdById: adminId } }),
  ]);

  if (ordersValidated > 0 || costs > 0 || productions > 0) {
    // Impossible de supprimer : on rétrograde en USER plutôt que de perdre les FK
    await prisma.user.update({
      where: { id: adminId },
      data: { role: "USER" },
    });
  } else {
    await prisma.user.delete({ where: { id: adminId } });
  }

  revalidatePath("/super-admin/admins");
  redirect("/super-admin/admins");
}

export async function createSaveur(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  if (name.length < 2) return { error: "Nom de saveur trop court" };

  const { slugify } = await import("@/lib/constants");
  const slug = slugify(name);
  try {
    await prisma.saveur.create({ data: { name, slug } });
  } catch {
    return { error: "Cette saveur existe déjà" };
  }

  revalidatePath("/admin/saveurs");
  revalidatePath("/admin/products");
  return { success: "Saveur créée" };
}

export async function updateSaveur(
  saveurId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  if (name.length < 2) return { error: "Nom de saveur trop court" };

  const isActive =
    formData.get("isActive") === "on" || formData.get("isActive") === "true";
  const { slugify } = await import("@/lib/constants");
  const slug = slugify(name);

  try {
    await prisma.saveur.update({
      where: { id: saveurId },
      data: { name, slug, isActive },
    });
  } catch {
    return { error: "Impossible de mettre à jour (nom déjà pris ?)" };
  }

  revalidatePath("/admin/saveurs");
  revalidatePath("/admin/products");
  revalidatePath("/catalogue");
  return { success: "Saveur mise à jour" };
}

export async function deleteSaveur(saveurId: string): Promise<void> {
  await requireAdmin();
  const used = await prisma.product.count({ where: { saveurId } });
  if (used > 0) {
    await prisma.saveur.update({
      where: { id: saveurId },
      data: { isActive: false },
    });
  } else {
    await prisma.saveur.delete({ where: { id: saveurId } });
  }
  revalidatePath("/admin/saveurs");
  revalidatePath("/admin/products");
  revalidatePath("/catalogue");
}

export async function createFormat(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  const volumeMlRaw = String(formData.get("volumeMl") || "");
  const volumeMl = volumeMlRaw ? Number(volumeMlRaw) : undefined;

  if (name.length < 1) return { error: "Nom de format requis" };

  const { slugify } = await import("@/lib/constants");
  const slug = slugify(name);
  try {
    await prisma.formatProduit.create({
      data: {
        name,
        slug,
        volumeMl: Number.isFinite(volumeMl) ? volumeMl : null,
      },
    });
  } catch {
    return { error: "Ce format existe déjà" };
  }

  revalidatePath("/admin/formats");
  revalidatePath("/admin/products");
  return { success: "Format créé" };
}

export async function updateFormat(
  formatId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  const volumeMlRaw = String(formData.get("volumeMl") || "");
  const volumeMl = volumeMlRaw ? Number(volumeMlRaw) : null;
  const isActive =
    formData.get("isActive") === "on" || formData.get("isActive") === "true";

  if (name.length < 1) return { error: "Nom de format requis" };

  const { slugify } = await import("@/lib/constants");
  const slug = slugify(name);

  try {
    await prisma.formatProduit.update({
      where: { id: formatId },
      data: {
        name,
        slug,
        volumeMl: Number.isFinite(volumeMl as number) ? volumeMl : null,
        isActive,
      },
    });
  } catch {
    return { error: "Impossible de mettre à jour (nom déjà pris ?)" };
  }

  revalidatePath("/admin/formats");
  revalidatePath("/admin/products");
  revalidatePath("/catalogue");
  return { success: "Format mis à jour" };
}

export async function deleteFormat(formatId: string): Promise<void> {
  await requireAdmin();
  const used = await prisma.product.count({ where: { formatId } });
  if (used > 0) {
    await prisma.formatProduit.update({
      where: { id: formatId },
      data: { isActive: false },
    });
  } else {
    await prisma.formatProduit.delete({ where: { id: formatId } });
  }
  revalidatePath("/admin/formats");
  revalidatePath("/admin/products");
  revalidatePath("/catalogue");
}
