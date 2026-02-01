import SiteNavbar from "@/components/site-navbar";
import SiteFooter from "@/components/site-footer";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-black">
      <SiteNavbar />
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">{children}</div>
      <SiteFooter />
    </main>
  );
}
