import { z } from 'zod';

export const createSavedSearchInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  filters: z.record(z.string(), z.unknown()),
  notificationsEnabled: z.boolean().default(true),
});

export const updateSavedSearchInputSchema = createSavedSearchInputSchema.partial();

export type CreateSavedSearchInput = z.infer<typeof createSavedSearchInputSchema>;
export type UpdateSavedSearchInput = z.infer<typeof updateSavedSearchInputSchema>;
