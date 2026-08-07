// Helpers for building CSV files returned directly as downloadable attachments.

// UTF-8 BOM so Excel renders Japanese text correctly.
const BOM = '\uFEFF';

type CsvCell = string | number | null | undefined;

function escapeCsvCell(value: CsvCell): string {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildCsv(headers: string[], rows: CsvCell[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(','));
  return BOM + lines.join('\r\n');
}

export function csvFileResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

export function csvDateStamp(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}
