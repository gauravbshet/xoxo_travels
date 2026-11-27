import { Suspense } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CompareTray } from "@/components/packages/compare-tray";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {/* Site chrome is hidden when printing (e.g. GST invoices) */}
      <div className="contents print:hidden">
        <Suspense fallback={<div className="h-16 lg:h-[72px]" />}>
          <Navbar />
        </Suspense>
      </div>
      <main id="main" className="flex-1">{children}</main>
      <div className="contents print:hidden">
        <Footer />
        <CompareTray />
      </div>
    </>
  );
}
