import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-12 text-center text-muted">
          Chargement…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
