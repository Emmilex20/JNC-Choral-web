import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import SiteNavbar from "@/components/site-navbar";
import SiteFooter from "@/components/site-footer";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/auth";
import OnboardingClient from "./ui/onboarding-client";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      onboardingComplete: true,
      isChorister: true,
      profile: true,
    },
  });

  if (!user) redirect("/auth/login");
  if (user.onboardingComplete) redirect("/profile");

  return (
    <main className="min-h-screen bg-black">
      <SiteNavbar />
      <section className="mx-auto max-w-3xl px-4 py-16 md:px-6">
        <OnboardingClient
          initial={{
            name: user.name ?? "",
            phone: user.profile?.phone ?? "",
            address: user.profile?.address ?? "",
            stateOfOrigin: user.profile?.stateOfOrigin ?? "",
            currentParish: user.profile?.currentParish ?? "",
            isChorister: Boolean(user.isChorister),
          }}
        />
      </section>
      <SiteFooter />
    </main>
  );
}
