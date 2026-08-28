import { useEffect, useRef, useState } from 'react';

import { useDebounce } from '@/hooks/use-debounce.hook';

const DEFAULT_DELAY = 300;

type UseDebouncedUrlSearchOptions = {
  /** Debounce window before the settled keyword is written to the URL. Defaults to 300ms. */
  delay?: number;
  /**
   * Applied to the keyword before it is compared against the URL and committed — for screens
   * that cap or otherwise canonicalise what may land in the query string.
   */
  normalize?: (value: string) => string;
};

/**
 * Keeps a debounced search box and its `history: 'push'` URL param in sync in both directions.
 *
 * Every filter hook in the app pairs a nuqs `useQueryStates` search param with a local input
 * state. Wiring that by hand reintroduces the same bug each time, so the three pieces that make
 * it correct live here instead of being copied per screen:
 *
 * 1. The keyword is debounced, so typing produces one history entry rather than one per keystroke.
 * 2. Only a value the user actually settled on is committed (`debouncedSearch === searchInput`).
 *    Without that guard a Back press — which resets the input below while the debounced value
 *    still trails behind — would immediately push the old keyword back into the URL and defeat
 *    the navigation.
 * 3. Back/forward, deep links and クリア all change the keyword from outside the input, so the
 *    input follows the URL as well. Adjusting the state during render (rather than from an
 *    effect) keeps the input and the URL consistent within the same commit.
 *
 * @param urlValue The keyword as it currently stands in the URL.
 * @param commit Writes a settled keyword to the URL; each screen supplies its own param names
 *   (and whether the write also resets the page).
 */
export function useDebouncedUrlSearch(
  urlValue: string,
  commit: (value: string) => void,
  options: UseDebouncedUrlSearchOptions = {},
): { searchInput: string; setSearchInput: (value: string) => void } {
  const { delay = DEFAULT_DELAY, normalize } = options;

  // Initialized from the URL so the input reflects any pre-existing search param.
  const [searchInput, setSearchInput] = useState(() => urlValue);
  const debouncedSearch = useDebounce(searchInput, delay);

  // Held in refs so the inline callbacks callers pass do not re-run the commit effect on every
  // render. Declared before the commit effect so each render refreshes them first.
  const commitRef = useRef(commit);
  const normalizeRef = useRef(normalize);
  useEffect(() => {
    commitRef.current = commit;
    normalizeRef.current = normalize;
  });

  useEffect(() => {
    if (debouncedSearch !== searchInput) return;

    const nextSearch = normalizeRef.current?.(debouncedSearch) ?? debouncedSearch;
    if (nextSearch === urlValue) return;

    commitRef.current(nextSearch);
  }, [debouncedSearch, searchInput, urlValue]);

  const [syncedSearch, setSyncedSearch] = useState(urlValue);
  if (syncedSearch !== urlValue) {
    setSyncedSearch(urlValue);
    setSearchInput(urlValue);
  }

  return { searchInput, setSearchInput };
}
