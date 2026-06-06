import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import SiteNavbar from "@/components/site-navbar";
import SiteFooter from "@/components/site-footer";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import ProfileForm from "./ui/profile-form";

export const metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/auth/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      name: true,
      email: true,
      image: true,
      role: true,
      isChorister: true,
      choristerVerified: true,
      onboardingComplete: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user?.email) {
    redirect("/auth/login");
  }

  return (
    <main className="min-h-screen bg-[#02040a] text-white">
      <SiteNavbar />
      <ProfileForm
        name={user.name ?? ""}
        email={user.email}
        image={user.image}
        role={user.role}
        isChorister={user.isChorister}
        choristerVerified={user.choristerVerified}
        onboardingComplete={user.onboardingComplete}
        joinedAt={user.createdAt.toISOString()}
        updatedAt={user.updatedAt.toISOString()}
      />
      <SiteFooter />
    </main>
  );
}
