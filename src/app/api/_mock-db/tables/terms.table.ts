import type {
  ActiveTermsItem,
  CreateTermsBody,
  CreateTermsVersionBody,
  GetActiveTermsQuery,
  RecordTermsConsentBody,
  TermsDetail,
  TermsFile,
  TermsListItem,
  TermsListQuery,
  TermsListResponse,
  TermsStatus,
  TermsVersionStatus,
  UpdateTermsBody,
  VersionHistoryItem,
} from '@/app/api/_schemas/terms.schema';

import {
  buildTermsPdfUrl,
  createSeedTermsConsents,
  createSeedTermsRows,
  getSeedTermsPdfFileSize,
} from '../seeds/terms.seed';
import type { TermsConsentRow, TermsRow } from '../types/terms.type';

const TERMS_STATUS_MOCK_AS_OF_DATE = '2025-11-15';

interface TermsStatusInput {
  readonly effectiveDate: string;
  readonly expiryDate?: string | null;
  readonly isDeleted?: boolean;
  readonly asOfDate?: string;
}

function getTermsStatusAsOfDate(): string {
  return TERMS_STATUS_MOCK_AS_OF_DATE;
}

function getTermsStatusFromDates({
  effectiveDate,
  expiryDate = null,
  isDeleted = false,
  asOfDate = getTermsStatusAsOfDate(),
}: TermsStatusInput): TermsStatus {
  if (effectiveDate > asOfDate) return 'draft';
  if (isDeleted) return 'expired';
  if (expiryDate && expiryDate < asOfDate) return 'expired';
  return 'published';
}

function getTermsVersionStatusFromDates({
  effectiveDate,
  expiryDate = null,
  isDeleted = false,
  asOfDate = getTermsStatusAsOfDate(),
}: TermsStatusInput): TermsVersionStatus {
  if (effectiveDate > asOfDate) return 'draft';
  if (isDeleted) return 'expired';
  if (expiryDate && expiryDate < asOfDate) return 'expired';
  return 'active';
}

function formatDateDisplay(date: string): string {
  return date.replace(/-/g, '/');
}

function getPreviousDateString(date: string): string {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number);
  const previousDate = new Date(Date.UTC(year, month - 1, day - 1));
  const previousYear = previousDate.getUTCFullYear();
  const previousMonth = String(previousDate.getUTCMonth() + 1).padStart(2, '0');
  const previousDay = String(previousDate.getUTCDate()).padStart(2, '0');

  return `${previousYear}-${previousMonth}-${previousDay}`;
}

function formatDateTimeDisplay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');

  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

function getPdfFileName(row: Pick<TermsRow, 'id' | 'pdfS3Key' | 'pdfFileName'>): string {
  return row.pdfFileName ?? row.pdfS3Key.split('/').pop() ?? `${row.id}.pdf`;
}

function getPdfFileSize(row: Pick<TermsRow, 'id' | 'pdfS3Key' | 'pdfFileName'>): string {
  return getSeedTermsPdfFileSize(getPdfFileName(row));
}

function buildTermsFile(row: TermsRow): TermsFile {
  return { name: getPdfFileName(row), size: getPdfFileSize(row), url: row.pdfUrl };
}

function getLineageRootId(row: TermsRow): string {
  return row.parentTermsId ?? row.id;
}

function getTermsStatus(row: TermsRow, asOf = getTermsStatusAsOfDate()): TermsStatus {
  return getTermsStatusFromDates({
    effectiveDate: row.effectiveFrom,
    expiryDate: row.effectiveTo,
    isDeleted: row.deletedAt !== null,
    asOfDate: asOf,
  });
}

function getVersionStatus(row: TermsRow, asOf = getTermsStatusAsOfDate()): TermsVersionStatus {
  return getTermsVersionStatusFromDates({
    effectiveDate: row.effectiveFrom,
    expiryDate: row.effectiveTo,
    isDeleted: row.deletedAt !== null,
    asOfDate: asOf,
  });
}

function isTermActive(row: TermsRow, asOf = getTermsStatusAsOfDate()): boolean {
  return getTermsStatus(row, asOf) === 'published';
}

function buildTermsNote(row: TermsRow): string {
  return row.remarks || `${row.title}に関する規約です。`;
}

function buildTermsBody(row: TermsRow): string {
  return (
    row.bodyText ||
    `第1条（総則）
${row.title}に関する利用条件を定めます。

第2条（適用範囲）
対象ブランドの会員は本規約に従うものとします。

第3条（補足）
詳細はPDF原本を参照してください。`
  );
}

function toTermsListItem(row: TermsRow): TermsListItem {
  return {
    id: row.id,
    title: row.title,
    termsType: row.termsType,
    version: row.version,
    brandEnum: row.brandEnum,
    effectiveFrom: row.effectiveFrom,
    effectiveTo: row.effectiveTo,
    displayOrder: row.displayOrder === null ? null : Number(row.displayOrder),
    requiresConsent: row.requiresConsent,
    remarks: row.remarks,
    status: getTermsStatus(row),
    isDeleted: row.deletedAt !== null,
  };
}

function toVersionHistoryItem(row: TermsRow): VersionHistoryItem {
  return {
    version: row.version,
    versionType: row.parentTermsId === null && row.prevTermsId === null ? 'original' : 'version',
    date: formatDateDisplay(row.effectiveFrom),
    period: `${formatDateDisplay(row.effectiveFrom)} 〜 ${row.effectiveTo ? formatDateDisplay(row.effectiveTo) : '現在'}`,
    summary: row.remarks || '変更内容の記載なし',
    status: getVersionStatus(row),
    file: buildTermsFile(row),
  };
}

function parseDisplayOrderInput(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? String(parsed) : null;
}

function getNextTermsId(rows: TermsRow[]): string {
  const maxId = rows.reduce((maxValue, row) => {
    const parsed = Number(row.id);
    return Number.isFinite(parsed) ? Math.max(maxValue, parsed) : maxValue;
  }, 0);
  return String(maxId + 1);
}

function matchesMobilePurpose(row: TermsRow, purpose?: GetActiveTermsQuery['purpose']): boolean {
  if (!purpose || purpose === 'app_launch') {
    return row.termsType !== 'withdrawal' && row.termsType !== 'suspension';
  }
  if (purpose === 'withdrawal') return row.termsType === 'withdrawal';
  return row.termsType === 'suspension';
}

function sortTermsRows(
  rows: TermsRow[],
  sort: TermsListQuery['sort'],
  order: TermsListQuery['order'],
): TermsRow[] {
  const direction = order === 'desc' ? -1 : 1;
  return [...rows].sort((left, right) => {
    let comparison = 0;
    switch (sort) {
      case 'effectiveFrom':
        comparison = left.effectiveFrom.localeCompare(right.effectiveFrom, 'ja');
        break;
      case 'createdAt':
        comparison = left.createdAt.localeCompare(right.createdAt, 'ja');
        break;
      default: {
        const leftOrder =
          left.displayOrder === null ? Number.MAX_SAFE_INTEGER : Number(left.displayOrder);
        const rightOrder =
          right.displayOrder === null ? Number.MAX_SAFE_INTEGER : Number(right.displayOrder);
        comparison = leftOrder - rightOrder;
      }
    }
    if (comparison === 0) comparison = left.id.localeCompare(right.id, 'ja');
    return comparison * direction;
  });
}

function getTermsFamily(rows: TermsRow[], row: TermsRow): TermsRow[] {
  const rootId = getLineageRootId(row);
  return rows
    .filter((candidate) => getLineageRootId(candidate) === rootId)
    .sort((left, right) => right.effectiveFrom.localeCompare(left.effectiveFrom, 'ja'));
}

export function createTermsTables() {
  return {
    terms: {
      _rows: [] as TermsRow[],
      _consents: [] as TermsConsentRow[],
      _seeded: false,
      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        this._rows = createSeedTermsRows();
        this._consents = createSeedTermsConsents();
      },
      list(query: TermsListQuery): TermsListResponse {
        this._seed();
        let items = this._rows;
        const totalAllItems = items.filter((row) =>
          query.includeDeleted ? true : row.deletedAt === null,
        ).length;

        if (query.search) {
          const keyword = query.search.toLowerCase();
          items = items.filter(
            (row) =>
              row.id.toLowerCase().includes(keyword) || row.title.toLowerCase().includes(keyword),
          );
        }
        if (query.brandEnum) items = items.filter((row) => row.brandEnum === query.brandEnum);
        if (query.termsType) items = items.filter((row) => row.termsType === query.termsType);
        if (query.status) items = items.filter((row) => getTermsStatus(row) === query.status);
        if (!query.includeDeleted) items = items.filter((row) => row.deletedAt === null);

        const sorted = sortTermsRows(items, query.sort, query.order);
        const totalItems = sorted.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / query.limit));
        const startIndex = (query.page - 1) * query.limit;

        return {
          items: sorted.slice(startIndex, startIndex + query.limit).map(toTermsListItem),
          totalAllItems,
          pagination: { page: query.page, limit: query.limit, totalItems, totalPages },
        };
      },

      getById(id: string): TermsRow | undefined {
        this._seed();
        return this._rows.find((row) => row.id === id);
      },

      getDetail(id: string): TermsDetail | undefined {
        this._seed();
        const current = this.getById(id);
        if (!current) return undefined;
        const lineage = getTermsFamily(this._rows, current);
        const activeVersion = lineage.find((row) => getVersionStatus(row) === 'active') ?? current;
        return {
          id: current.id,
          title: current.title,
          termsType: current.termsType,
          brandEnum: current.brandEnum,
          status: getTermsStatus(current),
          currentVersion: activeVersion.version,
          effectiveFrom: activeVersion.effectiveFrom,
          effectiveTo: activeVersion.effectiveTo,
          displayOrder:
            activeVersion.displayOrder === null ? null : Number(activeVersion.displayOrder),
          requiresConsent: activeVersion.requiresConsent,
          remarks: buildTermsNote(current),
          bodyText: buildTermsBody(activeVersion),
          currentFile: buildTermsFile(activeVersion),
          versions: lineage.map(toVersionHistoryItem),
          createdBy: current.createdBy,
          updatedBy: current.updatedBy,
          createdAt: formatDateTimeDisplay(current.createdAt),
          updatedAt: formatDateTimeDisplay(current.updatedAt),
          isDeleted: current.deletedAt !== null,
        };
      },

      createOriginal(input: CreateTermsBody): TermsRow {
        this._seed();
        const now = new Date().toISOString();
        const row: TermsRow = {
          id: getNextTermsId(this._rows),
          parentTermsId: null,
          prevTermsId: null,
          termsType: input.termsType,
          brandEnum: input.brandEnum,
          title: input.title,
          version: input.version,
          effectiveFrom: input.effectiveFrom,
          effectiveTo: input.effectiveTo ?? null,
          displayOrder: parseDisplayOrderInput(input.displayOrder),
          requiresConsent: input.requiresConsent,
          remarks: input.remarks ?? null,
          bodyText: '',
          pdfS3Key: input.pdfS3Key,
          pdfUrl: input.pdfUrl ?? buildTermsPdfUrl(input.pdfS3Key),
          pdfFileName: input.pdfFileName ?? null,
          createdAt: now,
          createdBy: '管理者',
          updatedAt: now,
          updatedBy: '管理者',
          deletedAt: null,
        };
        this._rows.unshift(row);
        return row;
      },

      createVersion(id: string, input: CreateTermsVersionBody): TermsRow | undefined {
        this._seed();
        const source = this.getById(id);
        if (!source) return undefined;
        const now = new Date().toISOString();
        if (
          !source.deletedAt &&
          source.effectiveFrom < input.effectiveFrom &&
          (!source.effectiveTo || source.effectiveTo >= input.effectiveFrom)
        ) {
          source.effectiveTo = getPreviousDateString(input.effectiveFrom);
          source.updatedAt = now;
          source.updatedBy = '管理者';
        }
        const row: TermsRow = {
          id: getNextTermsId(this._rows),
          parentTermsId: source.parentTermsId ?? source.id,
          prevTermsId: source.id,
          termsType: source.termsType,
          brandEnum: source.brandEnum,
          title: input.title,
          version: input.version,
          effectiveFrom: input.effectiveFrom,
          effectiveTo: input.effectiveTo ?? null,
          displayOrder: parseDisplayOrderInput(input.displayOrder) ?? source.displayOrder,
          requiresConsent: input.requiresConsent,
          remarks: input.remarks ?? null,
          bodyText: source.bodyText,
          pdfS3Key: input.pdfS3Key,
          pdfUrl: input.pdfUrl ?? buildTermsPdfUrl(input.pdfS3Key),
          pdfFileName: input.pdfFileName ?? null,
          createdAt: now,
          createdBy: '管理者',
          updatedAt: now,
          updatedBy: '管理者',
          deletedAt: null,
        };
        this._rows.unshift(row);
        return row;
      },

      update(id: string, input: UpdateTermsBody): TermsRow | undefined {
        this._seed();
        const index = this._rows.findIndex((row) => row.id === id);
        if (index === -1) return undefined;
        const current = this._rows[index]!;
        const nextPdfS3Key = input.pdfS3Key ?? current.pdfS3Key;
        const updated: TermsRow = {
          ...current,
          title: input.title ?? current.title,
          version: input.version ?? current.version,
          effectiveFrom: input.effectiveFrom ?? current.effectiveFrom,
          effectiveTo: input.effectiveTo === undefined ? current.effectiveTo : input.effectiveTo,
          displayOrder:
            input.displayOrder === undefined
              ? current.displayOrder
              : parseDisplayOrderInput(input.displayOrder),
          requiresConsent: input.requiresConsent ?? current.requiresConsent,
          remarks: input.remarks === undefined ? current.remarks : input.remarks,
          pdfS3Key: nextPdfS3Key,
          pdfUrl:
            input.pdfUrl === undefined
              ? input.pdfS3Key === undefined
                ? current.pdfUrl
                : buildTermsPdfUrl(nextPdfS3Key)
              : input.pdfUrl,
          pdfFileName: input.pdfFileName === undefined ? current.pdfFileName : input.pdfFileName,
          updatedAt: new Date().toISOString(),
          updatedBy: '管理者',
        };
        this._rows[index] = updated;
        return updated;
      },

      logicalDelete(id: string): TermsRow | undefined {
        this._seed();
        const row = this.getById(id);
        if (!row) return undefined;
        const deletedAt = new Date().toISOString();
        row.deletedAt = deletedAt;
        row.updatedAt = deletedAt;
        row.updatedBy = '管理者';
        return row;
      },

      recordConsents(input: RecordTermsConsentBody): number {
        this._seed();
        let recorded = 0;
        for (const requestedTermId of input.termsIds) {
          const requestedTerm = this.getById(requestedTermId);
          if (!requestedTerm) continue;
          const alreadyExists = this._consents.some(
            (consent) =>
              consent.memberId === input.memberId && consent.termsId === requestedTerm.id,
          );
          if (alreadyExists) continue;
          this._consents.push({
            consentId: `TC${String(this._consents.length + 1).padStart(3, '0')}`,
            memberId: input.memberId,
            termsId: requestedTerm.id,
            source: input.source,
            consentedAt: new Date().toISOString(),
          });
          recorded += 1;
        }
        return recorded;
      },

      getActive(query: GetActiveTermsQuery): ActiveTermsItem[] {
        this._seed();
        return this._rows
          .filter(
            (row) =>
              row.brandEnum === query.brand &&
              isTermActive(row) &&
              matchesMobilePurpose(row, query.purpose),
          )
          .sort((left, right) => {
            const leftOrder =
              left.displayOrder === null ? Number.MAX_SAFE_INTEGER : Number(left.displayOrder);
            const rightOrder =
              right.displayOrder === null ? Number.MAX_SAFE_INTEGER : Number(right.displayOrder);
            if (leftOrder !== rightOrder) return leftOrder - rightOrder;
            return left.effectiveFrom.localeCompare(right.effectiveFrom, 'ja');
          })
          .map((row) => ({
            id: row.id,
            title: row.title,
            version: row.version,
            pdfUrl: row.pdfUrl,
            requiresConsent:
              row.requiresConsent &&
              !(
                query.memberId &&
                this._consents.some(
                  (consent) => consent.memberId === query.memberId && consent.termsId === row.id,
                )
              ),
          }));
      },
    },
  };
}
