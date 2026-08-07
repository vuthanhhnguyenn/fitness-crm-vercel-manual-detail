export type StoreHolidaysType = {
  getHolidays(
    storeId: string,
    from: string,
    to: string,
  ): import('@/app/api/_schemas/lesson-schedule.schema').StoreHolidaysResponse;
};
