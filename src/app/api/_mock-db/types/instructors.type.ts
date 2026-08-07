export type InstructorsType = {
  _rows: Array<{
    instructor_id: string;
    instructor_name: string;
    store_id: string;
    role: string;
    photo_url?: string;
  }>;
  _seeded: boolean;
  _seed(): void;
  getList(
    storeId?: string,
    role?: string,
  ): Array<{
    instructor_id: string;
    instructor_name: string;
    store_id: string;
    role: string;
    photo_url?: string;
  }>;
  getById(id: string):
    | {
        instructor_id: string;
        instructor_name: string;
        store_id: string;
        role: string;
        photo_url?: string;
      }
    | undefined;
};
