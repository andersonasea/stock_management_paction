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

  const products = [
    {
      name: "EsthyPyaourt Vanille 250 ml",
      saveurId: vanille.id,
      formatId: ml250.id,
      description: "Format pratique — Naturel & savoureux",
      imageUrl: "/banner.jpg",
      unitPrice: 2500,
      productionCost: 1200,
      stockQuantity: 50,
    },
    {
      name: "EsthyPyaourt Vanille 500 ml",
      saveurId: vanille.id,
      formatId: ml500.id,
      description: "Format pour plus de gourmandise — Saveur vanille",
      imageUrl: "/visuel1.jpg",
      unitPrice: 4500,
      productionCost: 2200,
      stockQuantity: 40,
    },
    {
      name: "EsthyPyaourt Arachide 250 ml",
      saveurId: arachide.id,
      formatId: ml250.id,
      description: "Format pratique — Saveur arachide",
      imageUrl: "/esthy.jpg",
      unitPrice: 2800,
      productionCost: 1400,
      stockQuantity: 35,
    },
    {
      name: "EsthyPyaourt Arachide 500 ml",
      saveurId: arachide.id,
      formatId: ml500.id,
      description: "Format pour plus de gourmandise — Saveur arachide",
      imageUrl: "/esthy.jpg",
      unitPrice: 5000,
      productionCost: 2500,
      stockQuantity: 30,
    },
  ];

  for (const product of products) {
    const existing = await prisma.product.findFirst({
      where: {
        saveurId: product.saveurId,
        formatId: product.formatId,
      },
    });

    if (!existing) {
      await prisma.product.create({
        data: {
          ...product,
          createdById: admin.id,
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
