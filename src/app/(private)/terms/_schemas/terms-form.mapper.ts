import type { GetCrmTermsByIdResponse } from '@/lib/api/types.gen';

import type { TermsFormValues } from './terms-form.schema';

export function getTermsPdfS3Key(pdfUrl: string): string | null {
  if (pdfUrl.startsWith('/')) {
    return pdfUrl.replace(/^\/+/, '') || null;
  }

  try {
    const key = new URL(pdfUrl).pathname.replace(/^\/+/, '');
    return key || null;
  } catch {
    return null;
  }
}

export function getTermsFormDefaultValues(detail: GetCrmTermsByIdResponse): TermsFormValues {
  return {
    brandEnum: [detail.brandEnum],
    title: detail.title,
    termsType: detail.termsType,
    version: detail.currentVersion,
    effectiveFrom: detail.effectiveFrom,
    effectiveTo: detail.effectiveTo,
    displayOrder: detail.displayOrder,
    requiresConsent: detail.requiresConsent,
    remarks: detail.remarks,
    pdfUrl: detail.currentFile.url ?? '',
    pdfFileName: detail.currentFile.name,
    pdfFileSize: 0,
  };
}

export function getTermsNewVersionDefaultValues(
  detail: GetCrmTermsByIdResponse,
): Partial<TermsFormValues> {
  return {
    brandEnum: [detail.brandEnum],
    title: detail.title,
    termsType: detail.termsType,
    displayOrder: detail.displayOrder,
    requiresConsent: detail.requiresConsent,
  };
}
