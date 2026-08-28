import { buildTermsSeed } from '@/app/api/_mock-db/seeds/terms.seed';
import type {
  TermsCreateResult,
  TermsDeleteResult,
  TermsRow,
  TermsType as TermsTableType,
  TermsUpdateResult,
} from '@/app/api/_mock-db/types/terms.type';
import type {
  CreateTermsBody,
  GetTermsQuery,
  TermsBrand,
  TermsDetailResponse,
  TermsListItemResponse,
  TermsStatus,
  TermsVersionEntry,
  UpdateTermsBody,
} from '@/app/api/_schemas/terms.schema';

/** Mirrors `banner.table.ts`'s `computeStatus` — never stored, always derived from `now()`. */
export function computeStatus(effectiveFrom: string, effectiveTo: string | null): TermsStatus {
  const now = Date.now();
  const from = new Date(effectiveFrom).getTime();

  if (now < from) return 'draft';
  if (effectiveTo && now > new Date(effectiveTo).getTime()) return 'expired';
  return 'published';
}

export function computeVersionKind(row: TermsRow): 'original' | 'version' {
  return row.parent_terms_id === null ? 'original' : 'version';
}

export function lineageRootId(row: TermsRow): string {
  return row.parent_terms_id ?? row.id;
}

export function lineage(rootId: string, allRows: TermsRow[]): TermsRow[] {
  return allRows
    .filter((row) => !row.is_deleted && lineageRootId(row) === rootId)
    .sort((a, b) => new Date(a.effective_from).getTime() - new Date(b.effective_from).getTime());
}

export function computeIsCurrentlyApplied(row: TermsRow): boolean {
  return computeStatus(row.effective_from, row.effective_to) === 'published';
}

/** Mirrors `terms.seed.ts`'s placeholder — real PDF extraction is a backend concern (research.md #3). */
function synthesizeBodyText(title: string, version: string): string {
  return `第1条（総則）\n本規約は「${title}」（${version}）の内容を定めるものです。\n第2条（適用範囲）\n本規約は全ての会員に適用されます。`;
}

export function toTermsListItemResponse(row: TermsRow): TermsListItemResponse {
  return {
    id: row.id,
    termsType: row.terms_type,
    brandEnum: row.brand_enum,
    title: row.title,
    version: row.version,
    effectiveFrom: row.effective_from,
    displayOrder: row.display_order,
    status: computeStatus(row.effective_from, row.effective_to),
    isDeleted: row.is_deleted,
  };
}

function findRelatedTermsRef(
  row: TermsRow,
  lineageRows: TermsRow[],
): TermsDetailResponse['relatedTermsRef'] {
  if (row.parent_terms_id) {
    const origin = lineageRows.find((entry) => entry.id === row.parent_terms_id);
    return origin ? { id: origin.id, title: origin.title, version: origin.version } : null;
  }

  const derivedVersions = lineageRows
    .filter((entry) => entry.prev_terms_id === row.id)
    .sort((a, b) => new Date(a.effective_from).getTime() - new Date(b.effective_from).getTime());

  const nextVersion = derivedVersions[0];
  return nextVersion
    ? { id: nextVersion.id, title: nextVersion.title, version: nextVersion.version }
    : null;
}

export function toTermsDetailResponse(row: TermsRow, allRows: TermsRow[]): TermsDetailResponse {
  const rootId = lineageRootId(row);
  const lineageRows = lineage(rootId, allRows);

  const versions: TermsVersionEntry[] = lineageRows.map((entry) => {
    const isCurrentlyApplied = computeIsCurrentlyApplied(entry);
    return {
      id: entry.id,
      version: entry.version,
      versionKind: computeVersionKind(entry),
      status: computeStatus(entry.effective_from, entry.effective_to),
      effectiveFrom: entry.effective_from,
      effectiveTo: entry.effective_to,
      changeSummary: entry.remarks,
      isCurrentlyApplied,
      ...(isCurrentlyApplied
        ? {
            pdfUrl: entry.pdf_url,
            pdfFileName: entry.pdf_file_name,
            pdfFileSize: entry.pdf_file_size,
          }
        : {}),
    };
  });

  return {
    id: row.id,
    parentTermsId: row.parent_terms_id,
    prevTermsId: row.prev_terms_id,
    termsType: row.terms_type,
    brandEnum: row.brand_enum,
    title: row.title,
    version: row.version,
    pdfUrl: row.pdf_url,
    pdfFileName: row.pdf_file_name,
    pdfFileSize: row.pdf_file_size,
    bodyText: row.body_text,
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
    displayOrder: row.display_order,
    requiresConsent: row.requires_consent,
    remarks: row.remarks,
    isDeleted: row.is_deleted,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: computeStatus(row.effective_from, row.effective_to),
    versionKind: computeVersionKind(row),
    isCurrentlyApplied: computeIsCurrentlyApplied(row),
    relatedTermsRef: findRelatedTermsRef(
      row,
      allRows.filter((entry) => !entry.is_deleted),
    ),
    versions,
  };
}

export function createTermsTables() {
  return {
    terms: {
      _rows: [] as TermsRow[],
      _seeded: false,
      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        this._rows = buildTermsSeed();
      },
      list(
        query: GetTermsQuery,
        brandScope: TermsBrand | null,
      ): { rows: TermsRow[]; total: number; totalAllItems: number } {
        this._seed();

        let rows = query.includeDeleted
          ? [...this._rows]
          : this._rows.filter((row) => !row.is_deleted);

        if (brandScope) {
          rows = rows.filter((row) => row.brand_enum === brandScope);
        }

        const totalAllItems = rows.length;

        if (query.termsType) {
          rows = rows.filter((row) => row.terms_type === query.termsType);
        }

        if (query.brandEnum) {
          rows = rows.filter((row) => row.brand_enum === query.brandEnum);
        }

        if (query.status) {
          rows = rows.filter(
            (row) => computeStatus(row.effective_from, row.effective_to) === query.status,
          );
        }

        if (query.query) {
          const normalized = query.query.toLowerCase().trim();
          rows = rows.filter(
            (row) =>
              row.id.toLowerCase().includes(normalized) ||
              row.title.toLowerCase().includes(normalized),
          );
        }

        rows = [...rows].sort((a, b) => {
          const orderA = a.display_order ?? Number.POSITIVE_INFINITY;
          const orderB = b.display_order ?? Number.POSITIVE_INFINITY;
          if (orderA !== orderB) return orderA - orderB;
          return new Date(b.effective_from).getTime() - new Date(a.effective_from).getTime();
        });

        const total = rows.length;
        const start = (query.page - 1) * query.limit;
        return { rows: rows.slice(start, start + query.limit), total, totalAllItems };
      },
      getById(id: string, brandScope: TermsBrand | null): TermsRow | undefined | null {
        this._seed();

        const row = this._rows.find((entry) => entry.id === id);
        if (!row) return undefined;
        if (brandScope && row.brand_enum !== brandScope) return null;

        return row;
      },
      create(data: CreateTermsBody, createdBy: string): TermsCreateResult {
        this._seed();

        const referencedIds = [data.parentTermsId, data.prevTermsId].filter(
          (value): value is string => !!value,
        );
        const invalidRef = referencedIds.some(
          (refId) => !this._rows.some((row) => row.id === refId && !row.is_deleted),
        );
        if (invalidRef) return 'invalid_lineage_ref';

        const ids = this._rows
          .map((row) => Number.parseInt(row.id.replace('TM-', ''), 10))
          .filter((n) => !Number.isNaN(n));
        const nextNumber = ids.length > 0 ? Math.max(...ids) + 1 : 1;
        const now = new Date().toISOString();

        const row: TermsRow = {
          id: `TM-${String(nextNumber).padStart(3, '0')}`,
          parent_terms_id: data.parentTermsId ?? null,
          prev_terms_id: data.prevTermsId ?? null,
          terms_type: data.termsType,
          brand_enum: data.brandEnum,
          title: data.title,
          version: data.version,
          pdf_url: data.pdfUrl,
          pdf_file_name: data.pdfFileName,
          pdf_file_size: data.pdfFileSize,
          body_text: synthesizeBodyText(data.title, data.version),
          effective_from: data.effectiveFrom,
          effective_to: data.effectiveTo ?? null,
          display_order: data.displayOrder ?? null,
          requires_consent: data.requiresConsent,
          remarks: data.remarks ?? null,
          is_deleted: false,
          created_by: createdBy,
          updated_by: createdBy,
          created_at: now,
          updated_at: now,
        };
        this._rows.push(row);
        return row;
      },
      update(id: string, patch: UpdateTermsBody, updatedBy: string): TermsUpdateResult {
        this._seed();

        const index = this._rows.findIndex((row) => row.id === id && !row.is_deleted);
        if (index === -1) return 'not_found';

        const existing = this._rows[index];
        const updated: TermsRow = {
          ...existing,
          title: patch.title ?? existing.title,
          version: patch.version ?? existing.version,
          effective_from: patch.effectiveFrom ?? existing.effective_from,
          effective_to: patch.effectiveTo !== undefined ? patch.effectiveTo : existing.effective_to,
          display_order:
            patch.displayOrder !== undefined ? patch.displayOrder : existing.display_order,
          requires_consent: patch.requiresConsent ?? existing.requires_consent,
          remarks: patch.remarks !== undefined ? patch.remarks : existing.remarks,
          pdf_url: patch.pdfUrl ?? existing.pdf_url,
          pdf_file_name: patch.pdfFileName ?? existing.pdf_file_name,
          pdf_file_size: patch.pdfFileSize ?? existing.pdf_file_size,
          body_text: patch.pdfUrl
            ? synthesizeBodyText(patch.title ?? existing.title, patch.version ?? existing.version)
            : existing.body_text,
          updated_by: updatedBy,
          updated_at: new Date().toISOString(),
        };
        this._rows[index] = updated;
        return updated;
      },
      delete(id: string): TermsDeleteResult {
        this._seed();

        const index = this._rows.findIndex((row) => row.id === id && !row.is_deleted);
        if (index === -1) return 'not_found';

        this._rows[index] = { ...this._rows[index], is_deleted: true };
        return true;
      },
    } satisfies TermsTableType,
  };
}
