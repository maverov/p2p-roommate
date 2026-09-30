import { z } from 'zod';

import { REPORT_REASONS } from '@/lib/labels';

export const createReportInputSchema = z
  .object({
    listingId: z.string().min(1).optional(),
    reportedUserId: z.string().min(1).optional(),
    reason: z.enum(REPORT_REASONS),
    details: z.string().trim().max(2000).optional(),
  })
  .refine((input) => input.listingId || input.reportedUserId, {
    message: 'Provide listingId, reportedUserId, or both.',
  })
  .refine((input) => input.reason !== 'OTHER' || Boolean(input.details), {
    message: 'Describe the problem when the reason is OTHER.',
    path: ['details'],
  });

export type CreateReportInput = z.infer<typeof createReportInputSchema>;
