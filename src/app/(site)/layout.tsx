import { Suspense } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CompareTray } from "@/components/packages/compare-tray";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Suspense fallback={<div className="h-16 lg:h-[72px]" />}>
        <Navbar />
      </Suspense>
      <main id="main" className="flex-1">{children}</main>
      <Footer />
      <CompareTray />
    </>
  );
}
