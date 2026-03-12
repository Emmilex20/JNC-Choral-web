import SiteNavbar from "@/components/site-navbar";
import SiteFooter from "@/components/site-footer";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="admin-shell relative min-h-screen overflow-x-clip bg-[#040712]">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10rem] top-24 h-[28rem] w-[28rem] rounded-full bg-cyan-400/12 blur-3xl" />
        <div className="absolute right-[-12rem] top-32 h-[34rem] w-[34rem] rounded-full bg-amber-300/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>
      <SiteNavbar />
      <div className="relative mx-auto max-w-[92rem] px-4 py-8 sm:px-6 lg:px-8 xl:py-12">
        {children}
      </div>
      <SiteFooter />
    </main>
  );
}
