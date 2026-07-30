import { z } from 'zod';

export const reviewTargetTypeSchema = z.enum(['LISTING', 'USER']);
export const reviewerRoleSchema = z.enum(['TENANT', 'OWNER']);

const reviewContentSchema = {
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().min(3).max(2000),
};

export const createReviewInputSchema = z.discriminatedUnion('targetType', [
  z.object({
    targetType: z.literal('LISTING'),
    listingId: z.string().min(1),
    ...reviewContentSchema,
  }),
  z.object({
    targetType: z.literal('USER'),
    targetUserId: z.string().min(1),
    ...reviewContentSchema,
  }),
]);

export const listReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  perPage: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateReviewInput = z.infer<typeof createReviewInputSchema>;
export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;
