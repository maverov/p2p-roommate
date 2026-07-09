import { z } from 'zod';

export const viewingRequestStatusSchema = z.enum([
  'REQUESTED',
  'ACCEPTED',
  'DECLINED',
  'CANCELLED',
]);

export const createViewingRequestInputSchema = z.object({
  requestedStartAt: z.coerce.date(),
  message: z.string().trim().max(1000).optional(),
});

export const updateViewingRequestInputSchema = z.object({
  status: viewingRequestStatusSchema,
});

export const listViewingRequestsQuerySchema = z.object({
  role: z.enum(['requester', 'owner', 'all']).default('all'),
});

export type CreateViewingRequestInput = z.infer<
  typeof createViewingRequestInputSchema
>;
export type UpdateViewingRequestInput = z.infer<
  typeof updateViewingRequestInputSchema
>;
export type ListViewingRequestsQuery = z.infer<
  typeof listViewingRequestsQuerySchema
>;
