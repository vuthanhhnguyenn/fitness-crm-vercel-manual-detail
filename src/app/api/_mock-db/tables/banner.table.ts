import { BANNER_BRANDS_MAPPING, SEED_BANNERS } from '@/app/api/_mock-db/seeds/banner.seed';
import { BannerBrandMapTable } from '@/app/api/_mock-db/types/banners.type';
import type {
  Banner,
  BannerDisplayOrderItem,
  BannerItemResponse,
  BannerStatus,
  CreateBannerBody,
  UpdateBannerBody,
} from '@/app/api/_schemas/banner.schema';
import type { BrandEnum } from '@/app/api/_schemas/brand.schema';

function computeStatus(periodStart: string, periodEnd: string | null | undefined): BannerStatus {
  const today = new Date();
  const start = new Date(periodStart);

  if (today < start) return 'draft';

  if (periodEnd) {
    const end = new Date(periodEnd);
    if (today > end) return 'out_of_period';
  }

  return 'published';
}

function normalizeOrder(rows: Banner[]): Banner[] {
  return [...rows]
    .sort((left, right) => left.order - right.order)
    .map((row, index) => ({
      ...row,
      order: index + 1,
    }));
}

export function enrichBanner(banner: Banner, brandEnum: BrandEnum[]): BannerItemResponse {
  return {
    id: banner.id,
    order: banner.order,
    imageUrl: banner.image_url,
    title: banner.title,
    linkUrl: banner.link_url,
    periodStart: banner.period_start,
    periodEnd: banner.period_end,
    webEnabled: banner.web_enabled,
    mobileEnabled: banner.mobile_enabled,
    brandEnum: brandEnum,
    status: computeStatus(banner.period_start, banner.period_end),
  };
}

function createBannerBrandMapTable(): BannerBrandMapTable {
  return {
    _rows: [],
    getByBannerId(bannerId: string): BrandEnum[] {
      return this._rows
        .filter((entry) => entry.banner_id === bannerId)
        .map((entry) => entry.brand_enum as BrandEnum);
    },
    setByBannerId(bannerId: string, brandIds: BrandEnum[]): void {
      this._rows = this._rows.filter((entry) => entry.banner_id !== bannerId);
      for (const brandId of [...new Set(brandIds)]) {
        this._rows.push({ banner_id: bannerId, brand_enum: brandId });
      }
    },
    deleteByBannerId(bannerId: string): void {
      this._rows = this._rows.filter((entry) => entry.banner_id !== bannerId);
    },
  };
}

export function createBannerTables() {
  return {
    banners: {
      _rows: [] as Banner[],
      _brandMap: createBannerBrandMapTable(),
      _seeded: false,
      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        this._rows = normalizeOrder(SEED_BANNERS);
        for (const entry of BANNER_BRANDS_MAPPING) {
          this._brandMap._rows.push({ ...entry });
        }
      },
      getBrandEnum(bannerId: string): BrandEnum[] {
        this._seed();
        return this._brandMap.getByBannerId(bannerId);
      },
      getList(): Banner[] {
        this._seed();
        return [...this._rows];
      },
      getById(id: string): Banner | undefined {
        this._seed();
        return this._rows.find((banner) => banner.id === id);
      },
      delete(id: string): boolean {
        this._seed();
        const index = this._rows.findIndex((banner) => banner.id === id);
        if (index === -1) return false;
        this._rows.splice(index, 1);
        this._brandMap.deleteByBannerId(id);
        this._rows = normalizeOrder(this._rows);
        return true;
      },
      add(data: CreateBannerBody): Banner {
        this._seed();
        const ids = this._rows
          .map((b) => Number.parseInt(b.id.replace('BN-', ''), 10))
          .filter((n) => !Number.isNaN(n));
        const nextNumber = ids.length > 0 ? Math.max(...ids) + 1 : 1;
        const maxOrder = this._rows.length > 0 ? Math.max(...this._rows.map((b) => b.order)) : 0;
        const bannerId = `BN-${String(nextNumber).padStart(3, '0')}`;
        this._brandMap.setByBannerId(bannerId, data.brandEnum);
        const banner: Banner = {
          id: bannerId,
          order: data.order ?? maxOrder + 1,
          image_url: data.imageUrl,
          title: data.title,
          link_url: data.linkUrl ?? null,
          period_start: data.periodStart,
          period_end: data.periodEnd ?? '',
          web_enabled: data.webEnabled,
          mobile_enabled: data.mobileEnabled,
        };
        this._rows.push(banner);
        this._rows = normalizeOrder(this._rows);
        return banner;
      },
      update(id: string, data: UpdateBannerBody): Banner | null {
        this._seed();
        const index = this._rows.findIndex((banner) => banner.id === id);
        if (index === -1) return null;
        const existing = this._rows[index];
        if (data.brandEnum) {
          this._brandMap.setByBannerId(id, data.brandEnum);
        }
        const updated: Banner = {
          ...existing,
          title: data.title ?? existing.title,
          image_url: data.imageUrl ?? existing.image_url,
          link_url: data.linkUrl !== undefined ? data.linkUrl : existing.link_url,
          period_start: data.periodStart ?? existing.period_start,
          period_end: data.periodEnd !== undefined ? (data.periodEnd ?? '') : existing.period_end,
          web_enabled: data.webEnabled ?? existing.web_enabled,
          mobile_enabled: data.mobileEnabled ?? existing.mobile_enabled,
          order: data.order ?? existing.order,
        };
        this._rows[index] = updated;
        this._rows = normalizeOrder(this._rows);
        return updated;
      },
      updateDisplayOrder(input: BannerDisplayOrderItem[]): BannerDisplayOrderItem[] | null {
        this._seed();

        if (input.length === 0) {
          return this._rows.map((banner) => ({
            id: banner.id,
            order: banner.order,
          }));
        }

        const exists = new Set(this._rows.map((banner) => banner.id));
        const hasUnknownId = input.some((item) => !exists.has(item.id));
        if (hasUnknownId) return null;

        const orderById = new Map(input.map((item) => [item.id, item.order]));
        const sorted = [...this._rows].sort((left, right) => {
          const leftOrder = orderById.get(left.id) ?? left.order;
          const rightOrder = orderById.get(right.id) ?? right.order;
          if (leftOrder !== rightOrder) return leftOrder - rightOrder;
          return left.order - right.order;
        });

        this._rows = sorted.map((banner, index) => ({
          ...banner,
          order: index + 1,
        }));

        return this._rows.map((banner) => ({
          id: banner.id,
          order: banner.order,
        }));
      },
    },
  };
}
