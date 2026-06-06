import { prisma } from "@/lib/prisma";

export const CURRENT_AUDITION_SETTING_ID = "current";

export const DEFAULT_AUDITION_ANTICIPATION_TEXT =
  "Audition dates are being prepared. Keep rehearsing, stay ready, and watch this space for the next call.";

export async function getCurrentAuditionSetting() {
  return prisma.auditionSetting.findUnique({
    where: { id: CURRENT_AUDITION_SETTING_ID },
  });
}
