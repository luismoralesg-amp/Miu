import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { BrandMark } from "@/design-system/components";
import { currentUser } from "@/modules/identity/session";

export const metadata: Metadata = { title: "Entrar" };

/** Sign-in has one focus: a single column, the shield, one field. */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await currentUser()) redirect("/");
  return (
    <div className="flex min-h-dvh flex-col px-5 py-8 md:py-12">
      <header className="mx-auto w-full max-w-[420px]">
        <BrandMark variant="lockup" />
      </header>
      <main className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-12">
        {children}
      </main>
      <footer className="mx-auto flex w-full max-w-[420px] flex-wrap gap-x-5 gap-y-2 text-label text-fg-muted">
        <Link href="/login/ayuda" className="underline-offset-4 hover:underline">
          Ayuda para entrar
        </Link>
      </footer>
    </div>
  );
}
