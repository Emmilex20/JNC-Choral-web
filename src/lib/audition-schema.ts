import { z } from "zod";

export const auditionSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(8, "Phone number is required"),
  email: z.string().email("Enter a valid email"),
  city: z.string().optional(),

  category: z.enum(["SINGER", "INSTRUMENTALIST", "PRODUCTION"]),

  // SINGER
  voicePart: z.enum(["SOPRANO", "ALTO", "TENOR", "BASS"]).optional(),
  singingExperience: z.string().optional(),
  auditionSong: z.string().optional(),

  // INSTRUMENTALIST
  instrument: z.string().optional(),
  instrumentLevel: z.string().optional(),
  canSightRead: z.boolean().optional(),

  // PRODUCTION
  productionRole: z.string().optional(),
  portfolioLink: z.string().url("Portfolio must be a valid URL").optional().or(z.literal("")),
  notes: z.string().optional(),
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
