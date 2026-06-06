import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import SiteNavbar from "@/components/site-navbar";
import SiteFooter from "@/components/site-footer";
import { authOptions } from "@/auth";
import { getUserGamificationSummary } from "@/lib/gamification";
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
      id: true,
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

  const gamification = await getUserGamificationSummary(user.id);

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
        gamification={{
          totalPoints: gamification.totalPoints,
          rank: gamification.rank,
          quizPoints: gamification.quizPoints,
          dailyChallengePoints: gamification.dailyChallengePoints,
          participationPoints: gamification.participationPoints,
          badges: gamification.badges.map((badge) => ({
            ...badge,
            awardedAt: badge.awardedAt.toISOString(),
          })),
          quizHistory: gamification.quizHistory.map((attempt) => ({
            id: attempt.id,
            score: attempt.score,
            totalQuestions: attempt.totalQuestions,
            completionTimeSeconds: attempt.completionTimeSeconds,
            createdAt: attempt.createdAt.toISOString(),
            quiz: attempt.quiz,
          })),
        }}
      />
      <SiteFooter />
    </main>
  );
}
