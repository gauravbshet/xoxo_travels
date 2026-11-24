import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthProvider } from "@/components/auth/auth-provider";
import { AuthSetupNotice } from "@/components/auth/auth-setup-notice";
import { AdminNav, AdminUser } from "@/components/admin/admin-nav";
import { Logo } from "@/components/layout/logo";
import { Skeleton } from "@/components/ui";
import { clerkEnabled } from "@/lib/auth/config";
import { adminOr404 } from "@/lib/auth/admin";
import { hasDb } from "@/lib/db";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin · XOXO Travels" }, robots: { index: false, follow: false } };

/* Admin has its own shell, separate from the public site. Every admin page
   and action checks the role again; this layout only gates the chrome. */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  // Without auth or a database there is nothing to administer. Show the setup notice
  // (never a working-looking admin). Throwing here would break keyless builds.
  if (!clerkEnabled || !hasDb) return <div className="grid min-h-screen place-items-center bg-cream p-4"><AuthSetupNotice /></div>;
  return (
    <AuthProvider>
      <div className="min-h-screen bg-cream">
        <Suspense fallback={<Skeleton className="m-6 h-96 rounded-xl" />}>
          <Gate>{children}</Gate>
        </Suspense>
      </div>
    </AuthProvider>
  );
}

async function Gate({ children }: { children: React.ReactNode }) {
  await adminOr404();
  return (
    <div className="lg:grid lg:min-h-screen lg:grid-cols-[14rem_minmax(0,1fr)]">
      <aside className="border-b border-line bg-paper lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3 px-4 py-3 lg:flex-col lg:items-stretch lg:gap-6 lg:py-6">
          <div className="flex items-center gap-2">
            <Logo />
            <span className="rounded-sm bg-ink px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Admin</span>
          </div>
          <div className="lg:hidden"><AdminUser /></div>
        </div>
        <div className="px-4 pb-3 lg:pb-0"><Suspense><AdminNav /></Suspense></div>
      </aside>
      <div className="min-w-0">
        <div className="hidden justify-end border-b border-line bg-paper px-6 py-3 lg:flex"><AdminUser /></div>
        <main id="main" className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
