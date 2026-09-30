import { z } from 'zod';

const resolutionNoteSchema = z.string().trim().min(1).max(1000);

/** Closing a report requires a note, so the other admin can see why it was closed. */
export const updateReportInputSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('REVIEWING') }),
  z.object({ status: z.literal('RESOLVED'), note: resolutionNoteSchema }),
  z.object({ status: z.literal('DISMISSED'), note: resolutionNoteSchema }),
]);

export type UpdateReportInput = z.infer<typeof updateReportInputSchema>;

export const BAN_DURATION_DAYS = [7, 30] as const;

export const banUserInputSchema = z.object({
  reason: z.string().trim().min(1).max(500),
  /** `null` bans permanently. */
  durationDays: z.union([z.literal(BAN_DURATION_DAYS[0]), z.literal(BAN_DURATION_DAYS[1])]).nullable(),
});

export type BanUserInput = z.infer<typeof banUserInputSchema>;

export const adminUpdateListingInputSchema = z.object({
  status: z.literal('ARCHIVED'),
});
