'use client';

import { cn } from '@/lib/utils/cn/cn';
import { app_vertical } from '@/lib/variables/variables';
import {
  encodeFilterToQueryString,
} from '@/lib/marketplace/marketplace';
import type { IMarketplaceListingFilter } from '@/types/interfaces/marketplace/listing';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface MarketplaceFilterSidebarProps {
  filter: IMarketplaceListingFilter;
  /**
   * Categories available for the multi-select. Sourced from the backend
   * discovery surface — for v1 we hardcode the top-level taxonomy here
   * so the page renders cleanly before a `/marketplace/facets` endpoint
   * ships. Update when that endpoint lands.
   */
  availableCategories?: string[];
}

const DEFAULT_CATEGORIES = [
  'apparel',
  'beauty',
  'home',
  'electronics',
  'accessories',
  'food-and-beverage',
];

const REGIONS = [
  { value: '', label: 'All regions' },
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'SA', label: 'Saudi Arabia' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'EU', label: 'European Union' },
];

/**
 * Filter sidebar for /marketplace.
 *
 * State is mirrored locally for snappy interaction; "Apply filters"
 * commits the state to the URL by navigating to /marketplace?…, which
 * triggers a fresh SSR render with the new filter. The cursor is
 * intentionally dropped on every filter change — a new filter is a new
 * paginated stream.
 *
 * Cleared values are removed from the URL, not set to empty strings, so
 * the URL stays readable (see encodeFilterToSearchParams which already
 * drops undefined/empty fields).
 */
const MarketplaceFilterSidebar = ({
  filter,
  availableCategories = DEFAULT_CATEGORIES,
}: MarketplaceFilterSidebarProps) => {
  const router = useRouter();
  const [draft, setDraft] = useState<IMarketplaceListingFilter>({
    ...filter,
    cursor: undefined,
  });

  const update = <K extends keyof IMarketplaceListingFilter>(
    key: K,
    value: IMarketplaceListingFilter[K],
  ) => setDraft((prev) => ({ ...prev, [key]: value, cursor: undefined }));

  const toggleCategory = (cat: string) => {
    const next = new Set(draft.category || []);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    update('category', next.size > 0 ? Array.from(next) : undefined);
  };

  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    const qs = encodeFilterToQueryString(draft);
    router.push(`/marketplace${qs}`);
  };

  const reset = () => {
    setDraft({});
    router.push('/marketplace');
  };

  const num = (v: number | undefined): string | number =>
    v === undefined || v === null ? '' : v;

  return (
    <form
      onSubmit={apply}
      className={cn(
        'border rounded-sm p-6 gap-6 w-full',
        app_vertical,
        'items-stretch',
      )}
      data-testid="marketplace-filter-sidebar"
    >
      <h2 className="text-base font-semibold">Filter listings</h2>

      <label className="flex flex-col gap-1">
        <span className="text-xs uppercase opacity-70">Search</span>
        <input
          type="search"
          placeholder="Title or description"
          value={draft.q || ''}
          onChange={(e) => update('q', e.target.value || undefined)}
          className="border border-secondary rounded-sm px-3 py-2 text-sm bg-transparent"
          data-testid="marketplace-filter-search"
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs uppercase opacity-70 mb-1">
          Categories
        </legend>
        {availableCategories.map((cat) => {
          const checked = (draft.category || []).includes(cat);
          return (
            <label
              key={cat}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleCategory(cat)}
                data-testid={`marketplace-filter-category-${cat}`}
              />
              <span className="capitalize">{cat.replace(/-/g, ' ')}</span>
            </label>
          );
        })}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs uppercase opacity-70 mb-1">Price</legend>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            placeholder="Min"
            value={num(draft.priceMin)}
            onChange={(e) => {
              const n = e.target.value === '' ? undefined : Number(e.target.value);
              update(
                'priceMin',
                n === undefined || !Number.isFinite(n) ? undefined : n,
              );
            }}
            className="border border-secondary rounded-sm px-2 py-2 text-sm bg-transparent w-1/2"
            data-testid="marketplace-filter-price-min"
          />
          <span className="opacity-50 text-xs">to</span>
          <input
            type="number"
            min={0}
            placeholder="Max"
            value={num(draft.priceMax)}
            onChange={(e) => {
              const n = e.target.value === '' ? undefined : Number(e.target.value);
              update(
                'priceMax',
                n === undefined || !Number.isFinite(n) ? undefined : n,
              );
            }}
            className="border border-secondary rounded-sm px-2 py-2 text-sm bg-transparent w-1/2"
            data-testid="marketplace-filter-price-max"
          />
        </div>
      </fieldset>

      <label className="flex flex-col gap-1">
        <span className="text-xs uppercase opacity-70">
          Minimum commission %
        </span>
        <input
          type="number"
          min={0}
          max={80}
          step={1}
          placeholder="e.g. 10"
          value={num(draft.commissionRateMin)}
          onChange={(e) => {
            const n = e.target.value === '' ? undefined : Number(e.target.value);
            update(
              'commissionRateMin',
              n === undefined || !Number.isFinite(n) ? undefined : n,
            );
          }}
          className="border border-secondary rounded-sm px-3 py-2 text-sm bg-transparent"
          data-testid="marketplace-filter-commission"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs uppercase opacity-70">Region</span>
        <select
          value={draft.region || ''}
          onChange={(e) => update('region', e.target.value || undefined)}
          className="border border-secondary rounded-sm px-3 py-2 text-sm bg-transparent"
          data-testid="marketplace-filter-region"
        >
          {REGIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-2 mt-2">
        <button
          type="submit"
          className="rounded-sm bg-primary-foreground text-background px-4 py-2 text-sm font-medium"
          data-testid="marketplace-filter-apply"
        >
          Apply filters
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-sm border border-secondary px-4 py-2 text-sm"
          data-testid="marketplace-filter-reset"
        >
          Reset
        </button>
      </div>
    </form>
  );
};

export default MarketplaceFilterSidebar;
