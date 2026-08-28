// Helper for returning a PDF file as a downloadable attachment.
// Phase 1: the byte content is a static placeholder (research.md §5) — the gating logic
// around when a route is allowed to call this is what's real, not the PDF's rendered content.

export function pdfFileResponse(buffer: Buffer, filename: string): Response {
  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
