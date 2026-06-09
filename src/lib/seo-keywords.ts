export const jncEntityKeywords = [
  "Jude Nnam",
  "Sir Jude Nnam",
  "Dr Sir Jude Nnam",
  "Dr. Sir Jude Nnam",
  "Dr Jude Nnam",
  "Dr. Jude Nnam",
  "Jude Nnam Chorale",
  "Sir Jude Nnam Chorale",
  "JNC",
  "JNC Platform",
  "JNC Chorale",
  "JNC Abuja",
  "JNC Nigeria",
  "JNC choir Abuja",
  "JNC choir Nigeria",
  "Jude Nnam Chorale Abuja",
  "Jude Nnam Chorale Nigeria",
  "Jude Nnam Chorale official website",
  "Jude Nnam official website",
  "JNC official website",
  "Sir Jude Nnam Abuja",
  "Sir Jude Nnam choir",
  "Jude Nnam music",
  "Sir Jude Nnam music",
  "Jude Nnam songs",
  "Sir Jude Nnam songs",
  "Jude Nnam choir",
  "Ancestor of Liturgical Music",
  "Jude Nnam Ancestor of Liturgical Music",
  "Nigerian gospel choir",
  "Nigerian Catholic choir",
  "Nigerian liturgical music",
  "Catholic liturgical music Nigeria",
  "African choral music",
  "African sacred music",
  "Igbo liturgical music",
  "Christian choir Nigeria",
  "gospel choir Abuja",
  "choir in Abuja",
] as const;

export const songKeywords = [
  "Chukwu Di Nso",
  "Jude Nnam Chukwu Di Nso",
  "Kimvwama",
  "Jude Nnam Kimvwama",
  "Chinecherem",
  "Jude Nnam Chinecherem",
] as const;

export const scoreKeywords = [
  "Sir Jude Nnam scores",
  "Jude Nnam scores",
  "Sir Jude Nnam sheet music",
  "Jude Nnam sheet music",
  "Jude Nnam music scores",
  "Jude Nnam choral scores",
  "Jude Nnam choir scores",
  "Jude Nnam PDF scores",
  "Sir Jude Nnam PDF scores",
  "Catholic choir sheet music",
  "African liturgical sheet music",
  "download choir scores",
] as const;

export const auditionKeywords = [
  "Jude Nnam Chorale auditions",
  "JNC auditions",
  "choir auditions Abuja",
  "singer auditions Abuja",
  "gospel choir auditions Nigeria",
  "Catholic choir auditions",
  "instrumentalist auditions Abuja",
  "production crew auditions",
] as const;

export const academyKeywords = [
  "JNC Music Academy",
  "Jude Nnam Music Academy",
  "music theory Nigeria",
  "vocal training Nigeria",
  "choral leadership",
  "worship music training",
  "instrumental training Nigeria",
  "sight singing practice",
  "solfa training",
  "choir training",
  "music quizzes",
  "daily music theory challenge",
] as const;

export const mediaKeywords = [
  "Jude Nnam Chorale videos",
  "Jude Nnam Chorale music",
  "Jude Nnam performance",
  "Sir Jude Nnam performance",
  "JNC videos",
  "JNC gallery",
  "JNC music library",
  "Nigerian choir videos",
  "gospel choir performance",
] as const;

export const communityKeywords = [
  "JNC community",
  "Jude Nnam Chorale choristers",
  "chorister spotlight",
  "choir members Nigeria",
  "JNC leaderboard",
  "JNC achievements",
] as const;

export const challengeKeywords = [
  "JNC music challenges",
  "vocal challenge",
  "sight reading challenge",
  "sight singing challenge",
  "choir challenge",
  "music quiz center",
  "choral knowledge quiz",
  "daily theory challenge",
] as const;

type KeywordGroup = ReadonlyArray<string | null | undefined>;

export function uniqueKeywords(...groups: KeywordGroup[]) {
  return Array.from(
    new Set(
      groups
        .flat()
        .map((item) => item?.trim())
        .filter((item): item is string => Boolean(item))
    )
  );
}
