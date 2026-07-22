"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().min(2, "Nom trop court"),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  password: z.string().min(6, "Au moins 6 caractères"),
});

export type AuthFormState = {
  error?: string;
  success?: string;
};

export async function registerUser(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Données invalides" };
  }

  const email = parsed.data.email.toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { error: "Cet email est déjà utilisé" };

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      phone: parsed.data.phone,
      passwordHash,
      role: "USER",
    },
  });

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch {
    return { success: "Compte créé. Connectez-vous." };
  }

  redirect("/catalogue");
}

export async function loginUser(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") || "").toLowerCase().trim();
  const password = String(formData.get("password") || "");
  const callbackUrl = String(formData.get("callbackUrl") || "");

  if (!email || password.length < 6) {
    return { error: "Email ou mot de passe invalide" };
  }

  // Pré-vérification DB : message clair si Vercel ne joint pas Supabase (IPv4/pooler)
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      return { error: "Email ou mot de passe incorrect" };
    }
    const valid = await bcrypt.compare(password, existing.passwordHash);
    if (!valid) {
      return { error: "Email ou mot de passe incorrect" };
    }
  } catch (err) {
    console.error("[login] database unreachable:", err);
    return {
      error:
        "Base de données inaccessible depuis Vercel. Utilisez l'URI Connection Pooling (port 6543) de Supabase dans DATABASE_URL.",
    };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { error: "Email ou mot de passe incorrect" };
      }
      console.error("[login] AuthError", error.type, error.cause);
      return {
        error:
          "Connexion impossible. Vérifiez AUTH_SECRET et AUTH_URL sur Vercel.",
      };
    }
    throw error;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (callbackUrl) redirect(callbackUrl);
  if (user?.role === "SUPER_ADMIN") redirect("/super-admin");
  if (user?.role === "ADMIN") redirect("/admin");
  redirect("/catalogue");
}

export async function logoutUser() {
  await signOut({ redirectTo: "/" });
}
