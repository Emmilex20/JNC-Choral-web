import { z } from "zod";

export const auditionSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(120),
  phone: z.string().trim().min(8, "Phone number is required").max(40),
  email: z.string().trim().email("Enter a valid email").max(254),
  city: z.string().max(120).optional(),

  category: z.enum(["SINGER", "INSTRUMENTALIST", "PRODUCTION"]),

  // SINGER
  voicePart: z.enum(["SOPRANO", "ALTO", "TENOR", "BASS"]).optional(),
  singingExperience: z.string().max(1000).optional(),
  auditionSong: z.string().max(200).optional(),

  // INSTRUMENTALIST
  instrument: z.string().max(120).optional(),
  instrumentLevel: z.string().max(60).optional(),
  canSightRead: z.boolean().optional(),

  // PRODUCTION
  productionRole: z.string().max(120).optional(),
  portfolioLink: z
    .string()
    .trim()
    .url("Portfolio must be a valid URL")
    .max(500)
    .refine((value) => /^https?:\/\//i.test(value), "Portfolio link must start with http:// or https://")
    .optional()
    .or(z.literal("")),
  notes: z.string().max(2000).optional(),
})
.superRefine((data, ctx) => {
  // Category-specific required fields
  if (data.category === "SINGER") {
    if (!data.voicePart) {
      ctx.addIssue({
        code: "custom",
        path: ["voicePart"],
        message: "Select your voice part",
      });
    }
  }

  if (data.category === "INSTRUMENTALIST") {
    if (!data.instrument || data.instrument.trim().length < 2) {
      ctx.addIssue({
        code: "custom",
        path: ["instrument"],
        message: "Instrument is required",
      });
    }
  }

  if (data.category === "PRODUCTION") {
    if (!data.productionRole || data.productionRole.trim().length < 2) {
      ctx.addIssue({
        code: "custom",
        path: ["productionRole"],
        message: "Select your role",
      });
    }
  }
});

export type AuditionInput = z.infer<typeof auditionSchema>;
