import { z } from 'zod';

export const reviewTargetTypeSchema = z.enum(['LISTING', 'USER']);
export const reviewerRoleSchema = z.enum(['TENANT', 'OWNER']);

export const createReviewInputSchema = z
  .object({
    targetType: reviewTargetTypeSchema,
    targetUserId: z.string().min(1).optional(),
    listingId: z.string().min(1).optional(),
    reviewerRole: reviewerRoleSchema,
    rating: z.number().int().min(1).max(5),
    body: z.string().trim().min(3).max(2000),
  })
  .refine(
    (input) =>
      input.targetType === 'USER'
        ? Boolean(input.targetUserId)
        : Boolean(input.listingId),
    {
      message: 'USER reviews require targetUserId. LISTING reviews require listingId.',
    },
  );

export const listReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  perPage: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateReviewInput = z.infer<typeof createReviewInputSchema>;
export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;
