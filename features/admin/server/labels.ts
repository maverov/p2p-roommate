import 'server-only';

import { getTranslations } from 'next-intl/server';

import { isReportReason } from '@/lib/labels';

/** Reports store a reason code; rows from before the codes existed hold free text, shown as-is. */
export async function getReportReasonLabel() {
  const t = await getTranslations({ locale: 'en', namespace: 'enums' });

  return (reason: string) => (isReportReason(reason) ? t(`reportReason.${reason}`) : reason);
}
