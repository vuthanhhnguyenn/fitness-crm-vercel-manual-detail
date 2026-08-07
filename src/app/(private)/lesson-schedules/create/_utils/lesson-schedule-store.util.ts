type StoreLike = {
  id: string;
  store_id: string;
};

/** Map CRM store master row to lesson-schedule domain store id (e.g. store-001 → ST001). */
export function toLessonScheduleStoreId(store: StoreLike): string {
  const match = store.id.match(/^store-(\d+)$/);
  if (match) {
    return `ST${match[1]}`;
  }

  if (/^ST\d+$/.test(store.store_id)) {
    return store.store_id;
  }

  return store.store_id ?? store.id;
}

export function findStoreByLessonScheduleStoreId<T extends StoreLike>(
  stores: T[],
  lessonStoreId: string,
): T | undefined {
  return stores.find((store) => toLessonScheduleStoreId(store) === lessonStoreId);
}
