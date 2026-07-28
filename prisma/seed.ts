import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Admin123!", 10);
  const userPassword = await bcrypt.hash("User123!", 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@esthypyaourt.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "superadmin@esthypyaourt.com",
      passwordHash,
      phone: "+243813808744",
      role: "SUPER_ADMIN",
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@esthypyaourt.com" },
    update: {},
    create: {
      name: "Admin Esthy",
      email: "admin@esthypyaourt.com",
      passwordHash,
      phone: "+243813808744",
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "client@esthypyaourt.com" },
    update: {},
    create: {
      name: "Client Demo",
      email: "client@esthypyaourt.com",
      passwordHash: userPassword,
      phone: "+243900000000",
      role: "USER",
    },
  });

  const vanille = await prisma.saveur.upsert({
    where: { slug: "vanille" },
    update: {},
    create: { name: "Vanille", slug: "vanille" },
  });
  const arachide = await prisma.saveur.upsert({
    where: { slug: "arachide" },
    update: {},
    create: { name: "Arachide", slug: "arachide" },
  });

  const ml250 = await prisma.formatProduit.upsert({
    where: { slug: "ml-250" },
    update: {},
    create: { name: "250 ml", slug: "ml-250", volumeMl: 250 },
  });
  const ml500 = await prisma.formatProduit.upsert({
    where: { slug: "ml-500" },
    update: {},
    create: { name: "500 ml", slug: "ml-500", volumeMl: 500 },
  });

  // Matières premières + stock initial via CUMP
  const materialsDef = [
    { name: "Lait", unit: "L" as const, qty: 200, unitPrice: 2500 },
    { name: "Sucre", unit: "KG" as const, qty: 50, unitPrice: 1800 },
    { name: "Arôme vanille", unit: "L" as const, qty: 5, unitPrice: 15000 },
    { name: "Pâte arachide", unit: "KG" as const, qty: 20, unitPrice: 8000 },
    { name: "Pot 250 ml", unit: "PCS" as const, qty: 500, unitPrice: 150 },
    { name: "Pot 500 ml", unit: "PCS" as const, qty: 400, unitPrice: 220 },
  ];

  const materialIds: Record<string, string> = {};
  for (const m of materialsDef) {
    const mat = await prisma.rawMaterial.upsert({
      where: { name: m.name },
      update: {
        unit: m.unit,
        stockQuantity: m.qty,
        unitCost: m.unitPrice,
        isActive: true,
      },
      create: {
        name: m.name,
        unit: m.unit,
        stockQuantity: m.qty,
        unitCost: m.unitPrice,
      },
    });
    materialIds[m.name] = mat.id;

    const hasPurchase = await prisma.purchase.findFirst({
      where: { rawMaterialId: mat.id },
    });
    if (!hasPurchase) {
      await prisma.purchase.create({
        data: {
          rawMaterialId: mat.id,
          quantity: m.qty,
          unitPrice: m.unitPrice,
          totalAmount: m.qty * m.unitPrice,
          supplier: "Fournisseur démo",
          note: "Stock initial seed",
          createdById: admin.id,
        },
      });
    }
  }

  const products = [
    {
      name: "EsthyPyaourt Vanille 250 ml",
      saveurId: vanille.id,
      formatId: ml250.id,
      description: "Format pratique — Naturel & savoureux",
      imageUrl: "/assets/gallery-01.jpeg",
      unitPrice: 2500,
      stockQuantity: 50,
      recipe: [
        { material: "Lait", qty: 0.22 },
        { material: "Sucre", qty: 0.03 },
        { material: "Arôme vanille", qty: 0.005 },
        { material: "Pot 250 ml", qty: 1 },
      ],
    },
    {
      name: "EsthyPyaourt Vanille 500 ml",
      saveurId: vanille.id,
      formatId: ml500.id,
      description: "Format pour plus de gourmandise — Saveur vanille",
      imageUrl: "/assets/gallery-10.jpeg",
      unitPrice: 4500,
      stockQuantity: 40,
      recipe: [
        { material: "Lait", qty: 0.45 },
        { material: "Sucre", qty: 0.06 },
        { material: "Arôme vanille", qty: 0.01 },
        { material: "Pot 500 ml", qty: 1 },
      ],
    },
    {
      name: "EsthyPyaourt Arachide 250 ml",
      saveurId: arachide.id,
      formatId: ml250.id,
      description: "Format pratique — Saveur arachide",
      imageUrl: "/assets/gallery-08.jpeg",
      unitPrice: 2800,
      stockQuantity: 35,
      recipe: [
        { material: "Lait", qty: 0.2 },
        { material: "Sucre", qty: 0.025 },
        { material: "Pâte arachide", qty: 0.04 },
        { material: "Pot 250 ml", qty: 1 },
      ],
    },
    {
      name: "EsthyPyaourt Arachide 500 ml",
      saveurId: arachide.id,
      formatId: ml500.id,
      description: "Format pour plus de gourmandise — Saveur arachide",
      imageUrl: "/assets/gallery-15.jpeg",
      unitPrice: 5000,
      stockQuantity: 30,
      recipe: [
        { material: "Lait", qty: 0.4 },
        { material: "Sucre", qty: 0.05 },
        { material: "Pâte arachide", qty: 0.08 },
        { material: "Pot 500 ml", qty: 1 },
      ],
    },
  ];

  for (const product of products) {
    const { recipe, ...data } = product;
    let existing = await prisma.product.findFirst({
      where: {
        saveurId: product.saveurId,
        formatId: product.formatId,
      },
    });

    const productionCost = recipe.reduce((sum, line) => {
      const mat = materialsDef.find((m) => m.name === line.material)!;
      return sum + line.qty * mat.unitPrice;
    }, 0);

    if (!existing) {
      existing = await prisma.product.create({
        data: {
          ...data,
          productionCost,
          createdById: admin.id,
        },
      });
    } else {
      existing = await prisma.product.update({
        where: { id: existing.id },
        data: {
          imageUrl: product.imageUrl,
          description: product.description,
          productionCost,
        },
      });
    }

    for (const line of recipe) {
      const rawMaterialId = materialIds[line.material];
      await prisma.productRecipeItem.upsert({
        where: {
          productId_rawMaterialId: {
            productId: existing.id,
            rawMaterialId,
          },
        },
        update: { quantityPerUnit: line.qty },
        create: {
          productId: existing.id,
          rawMaterialId,
          quantityPerUnit: line.qty,
        },
      });
    }
  }

  console.log("Seed OK");
  console.log("SuperAdmin:", superAdmin.email, "/ Admin123!");
  console.log("Admin:", admin.email, "/ Admin123!");
  console.log("Client: client@esthypyaourt.com / User123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
