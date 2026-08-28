import { downloadCsv, getCsvFilenameFromContentDisposition } from '@/utils/csv.util';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { EntryExit } from '@/lib/api';
import type { PostCrmEntryExitLogsExportData } from '@/lib/api/types.gen';

type CsvDownload = { blob: Blob; filename: string };

/**
 * CSV export for the entry-exit history screen — real file response
 * (`parseAs: 'blob'` + Content-Disposition), matching
 * `equipment-csv-export-button.tsx`'s hook, not the older JSON-array
 * pattern used by lockers/banners exports (research.md R4).
 */
export function useEntryExitHistoryCsvExport() {
  return useMutation({
    mutationFn: async (
      body: NonNullable<PostCrmEntryExitLogsExportData['body']>,
    ): Promise<CsvDownload> => {
      const { data, response } = await EntryExit.postCrmEntryExitLogsExport({
        body,
        parseAs: 'blob',
        throwOnError: true,
      });

      return {
        blob: data as Blob,
        filename: getCsvFilenameFromContentDisposition(
          response.headers.get('content-disposition'),
          'entry_exit_history.csv',
        ),
      };
    },
    onSuccess: ({ blob, filename }) => {
      downloadCsv(blob, filename);
      toast.success('CSVを出力しました');
    },
    onError: () => {
      toast.error('CSVの出力に失敗しました');
    },
  });
}
