import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import SiteNavbar from "@/components/site-navbar";
import SiteFooter from "@/components/site-footer";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import ProfileForm from "./ui/profile-form";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/auth/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { name: true, email: true, image: true },
  });

  if (!user?.email) {
    redirect("/auth/login");
  }

  return (
    <main className="min-h-screen bg-black">
      <SiteNavbar />
      <section className="mx-auto max-w-3xl px-4 py-16 md:px-6">
        <ProfileForm
          name={user.name ?? ""}
          email={user.email}
          image={user.image}
        />
      </section>
      <SiteFooter />
    </main>
  );
}
