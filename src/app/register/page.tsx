"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerUser, type AuthFormState } from "@/lib/actions/auth";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(
    registerUser,
    {} as AuthFormState
  );

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="card-panel animate-rise">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-brand">
          Créer un compte
        </h1>
        <p className="mt-2 text-sm text-muted">
          Commandez vos yaourts EsthyPyaourt en quelques clics
        </p>
        <form action={action} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="name">
              Nom complet
            </label>
            <input id="name" name="name" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input id="email" name="email" type="email" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="phone">
              Téléphone
            </label>
            <input
              id="phone"
              name="phone"
              className="input"
              placeholder="+243 …"
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="input"
            />
          </div>
          {state.error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-danger">
              {state.error}
            </p>
          )}
          {state.success && (
            <p className="rounded-xl bg-green-50 px-3 py-2 text-sm text-success">
              {state.success}
            </p>
          )}
          <button type="submit" disabled={pending} className="btn btn-primary w-full">
            {pending ? "Création…" : "S'inscrire"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-muted">
          Déjà client ?{" "}
          <Link href="/login" className="font-semibold text-brand">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
