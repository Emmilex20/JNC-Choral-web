-- Add userId to AuditionApplication for tracking by registered users
ALTER TABLE "AuditionApplication" ADD COLUMN "userId" TEXT;

-- Create index for faster lookups
CREATE INDEX "AuditionApplication_userId_idx" ON "AuditionApplication"("userId");

-- Add foreign key to User
ALTER TABLE "AuditionApplication"
ADD CONSTRAINT "AuditionApplication_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
