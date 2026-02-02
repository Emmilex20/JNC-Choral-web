import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-black">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-2xl bg-white/10">
                <img src="/logo.svg" alt="JNC logo" className="h-full w-full object-cover" />
              </div>
              <p className="text-lg font-semibold text-white">Jude Nnam Choral</p>
            </div>
            <p className="mt-2 text-sm text-white/70">
              Spreading joy through music - auditions, performances, and community.
            </p>
          </div>

          <div className="grid gap-2 text-sm">
            <p className="font-semibold text-white">Quick Links</p>
            <Link className="text-white/70 hover:text-white" href="/auditions">
              Auditions
            </Link>
            <Link className="text-white/70 hover:text-white" href="/events">
              Events
            </Link>
            <Link className="text-white/70 hover:text-white" href="/gallery">
              Gallery
            </Link>
          </div>

          <div className="grid gap-2 text-sm">
            <p className="font-semibold text-white">Contact</p>
            <p className="text-white/70">Abuja, Nigeria</p>
            <p className="text-white/70">08064087399 - 0803943856</p>
            <p className="text-white/70">jncplatform@gmail.com</p>
          </div>
        </div>

        <Separator className="my-8 bg-white/10" />

        <p className="text-xs text-white/60">
          © {new Date().getFullYear()} Jude Nnam Choral Platform. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
