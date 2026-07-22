"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { loginUser, type AuthFormState } from "@/lib/actions/auth";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "";
  const [state, action, pending] = useActionState(
    loginUser,
    {} as AuthFormState
  );

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="card-panel animate-rise">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-brand">
          Connexion
        </h1>
        <p className="mt-2 text-sm text-muted">
          Accédez à votre espace EsthyPyaourt
        </p>
        <form action={action} className="mt-6 space-y-4">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="input"
              placeholder="vous@email.com"
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
          <button type="submit" disabled={pending} className="btn btn-primary w-full">
            {pending ? "Connexion…" : "Se connecter"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-muted">
          Pas encore de compte ?{" "}
          <Link href="/register" className="font-semibold text-brand">
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}
