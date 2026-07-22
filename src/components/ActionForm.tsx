"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/actions/stock";

type Props = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  className?: string;
};

export function ActionForm({ action, children, className }: Props) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className={className}>
      {children}
      {state.error && (
        <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="mt-3 rounded-xl bg-green-50 px-3 py-2 text-sm text-success">
          {state.success}
        </p>
      )}
      {pending && <p className="mt-2 text-sm text-muted">Traitement…</p>}
    </form>
  );
}
