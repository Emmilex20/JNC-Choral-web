"use client";

import { MotionConfig } from "framer-motion";
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  // reducedMotion="user" turns off movement animations for visitors who ask for it.
  return (
    <SessionProvider>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </SessionProvider>
  );
}
