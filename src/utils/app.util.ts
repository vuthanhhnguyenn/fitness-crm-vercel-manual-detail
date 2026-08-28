import { BrandEnum } from '@/lib/api/types.gen';

export const toSelectItems = (options: { value: string; label: string }[]) =>
  Object.fromEntries(options.map((opt) => [opt.value || opt.label, opt.label]));

export const isAllBrandsSelected = (brands: BrandEnum[]): boolean =>
  Object.values(BrandEnum).every((brand) => brands.includes(brand));

export const filterActiveClass = (isActive: boolean) =>
  isActive ? 'border-primary bg-primary/10 text-foreground' : '';
