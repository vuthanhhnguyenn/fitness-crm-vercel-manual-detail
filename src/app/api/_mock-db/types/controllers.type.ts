import type {
  Controller,
  ControllerConnectedDevice,
  ControllerDetail,
  ControllerDeviceSummary,
  ControllerHistoryItem,
  GetControllersQuery,
  GetControllersResponse,
  PatchControllerRequest,
  UpsertControllerRequest,
} from '@/app/api/_schemas/controller.schema';

export type ControllersType = {
  _rows: Controller[];
  _historyByControllerId: Record<string, ControllerHistoryItem[]>;
  _seeded: boolean;
  _seed(): void;
  getAll(): Controller[];
  getById(controllerId: string): Controller | undefined;
  list(query: GetControllersQuery): GetControllersResponse;
  getDetailById(controllerId: string): ControllerDetail | undefined;
  getConnectedDevices(controllerId: string): {
    devices: ControllerConnectedDevice[];
    summary: ControllerDeviceSummary;
  };
  getHistory(controllerId: string): ControllerHistoryItem[];
  create(input: UpsertControllerRequest): ControllerDetail;
  update(controllerId: string, input: PatchControllerRequest): ControllerDetail | undefined;
  delete(
    controllerId: string,
  ): { ok: true } | { ok: false; reason: 'has_connected_devices'; device_count: number };
};
