function escapeCsvCell(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

export function buildCsv(headers: string[], rows: string[][]): string {
  const lines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map((cell) => escapeCsvCell(String(cell ?? ''))).join(',')),
  ];

  return lines.join('\r\n');
}

export function createCsvFilename(prefix: string): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  return `${prefix}_${timestamp}.csv`;
}

export function downloadCsv(content: string | Blob, filename: string): void {
  // A Blob coming from the server is already a complete file (BOM included),
  // while a client-built string still needs the BOM prepended for Excel.
  const blob =
    content instanceof Blob
      ? content
      : new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// Extracts the filename the backend sets via the Content-Disposition header,
// supporting both `filename*=UTF-8''...` and plain `filename="..."` forms.
export function getCsvFilenameFromContentDisposition(
  header: string | null,
  fallback: string,
): string {
  if (!header) return fallback;

  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const plainMatch = header.match(/filename="?([^";]+)"?/i);
  return plainMatch?.[1] ?? fallback;
}

export function exportCsv(headers: string[], rows: string[][], filenamePrefix: string): void {
  downloadCsv(buildCsv(headers, rows), createCsvFilename(filenamePrefix));
}
