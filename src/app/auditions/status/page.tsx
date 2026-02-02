import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import SiteNavbar from "@/components/site-navbar";
import SiteFooter from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Audition Status",
  description:
    "Track the status of your Jude Nnam Choral audition application.",
  alternates: {
    canonical: "https://www.jnc-choral.vercel.app/auditions/status",
  },
};

function statusBadge(status: string) {
  if (status === "ACCEPTED") {
    return "border-emerald-400/40 text-emerald-200 bg-emerald-400/10";
  }
  if (status === "REJECTED") {
    return "border-red-400/40 text-red-200 bg-red-400/10";
  }
  if (status === "SHORTLISTED") {
    return "border-amber-300/40 text-amber-200 bg-amber-300/10";
  }
  return "border-white/15 text-white/80 bg-white/5";
}

export default async function AuditionStatusPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/auditions/status");
  }

  const where = session.user.email
    ? { OR: [{ userId: session.user.id }, { email: session.user.email }] }
    : { userId: session.user.id };

  const applications = await prisma.auditionApplication.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-black">
      <SiteNavbar />

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-10">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-white/50">
                Auditions
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-white">
                Application status
              </h1>
              <p className="mt-2 text-sm text-white/70">
                Track the progress of your audition application(s). We will also
                contact you directly when a decision is made.
              </p>
            </div>
            <div className="text-xs text-white/60">
              Signed in as{" "}
              <span className="text-white">
                {session.user.email ?? session.user.name}
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {applications.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-sm text-white/70">
                No applications yet. Submit an audition to see your status here.
              </div>
            ) : (
              applications.map((app) => (
                <div
                  key={app.id}
                  className="rounded-2xl border border-white/10 bg-black/30 p-5"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-white">
                        {app.fullName}
                      </p>
                      <p className="text-sm text-white/60">
                        {new Date(app.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge(
                        app.status
                      )}`}
                    >
                      {app.status}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm text-white/70 md:grid-cols-3">
                    <div>
                      <span className="text-white/90">Category:</span>{" "}
                      {app.category}
                    </div>
                    <div>
                      <span className="text-white/90">Phone:</span> {app.phone}
                    </div>
                    <div>
                      <span className="text-white/90">Email:</span> {app.email}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
