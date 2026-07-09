import { z } from 'zod';

export const updateProfileInputSchema = z.object({
  displayName: z.string().trim().min(2).max(120).optional(),
  bio: z.string().trim().max(2000).optional(),
  phoneNumber: z.string().trim().min(3).max(40).optional(),
  citySlug: z.string().trim().min(2).max(80).optional(),
  neighborhoodSlug: z.string().trim().min(2).max(100).optional(),
  avatarUrl: z.string().url().max(2048).optional(),
  publicContactAllowed: z.boolean().optional(),
  responseTimeMinutes: z.number().int().min(0).max(60 * 24 * 30).optional(),
  responseRate: z.number().int().min(0).max(100).optional(),
  successfulRentals: z.number().int().min(0).max(100_000).optional(),
  traits: z.array(z.string().trim().min(1).max(80)).max(50).optional(),
  languages: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  roommatePreferences: z.record(z.string(), z.unknown()).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;
