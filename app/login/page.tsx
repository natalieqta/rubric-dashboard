import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    const role = (session.user as { role?: string }).role;
    redirect(role === "Admin" ? "/dashboard/admin" : "/dashboard/coach");
  }
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-zinc-100">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
