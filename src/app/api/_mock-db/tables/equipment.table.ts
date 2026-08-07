import type {
  Controller,
  ControllerConnectedDevice,
  ControllerDetail,
  ControllerDeviceSummary,
  ControllerHistoryItem,
  ControllerListItem,
  GetControllersQuery,
  GetControllersResponse,
  PatchControllerRequest,
  UpsertControllerRequest,
} from '@/app/api/_schemas/controller.schema';
import type {
  ConnectedEquipmentDetail,
  ConnectedEquipmentListItem,
  EquipmentStatusHistoryItem,
  PatchEquipmentRequest,
  UpsertEquipmentRequest,
} from '@/app/api/_schemas/equipment.schema';
import type { VisitExperienceDetail } from '@/app/api/_schemas/visit-experience.schema';

import type { DbType } from '../_db.types';
import type { EquipmentMeta } from '../seeds/equipment.seed';
import {
  SEED_CONNECTED_EQUIPMENT,
  SEED_CONTROLLERS,
  SEED_CONTROLLER_HISTORY,
  SEED_EQUIPMENT_HISTORY,
  buildControllerDeviceSummary,
  buildEquipmentDetail,
  buildLabelsFromRule,
} from '../seeds/equipment.seed';
import { SEED_VISIT_EXPERIENCES } from '../seeds/visit-experience.seed';

export function createEquipmentTables(getDb: () => DbType) {
  return {
    equipment: {
      _rows: [] as ConnectedEquipmentListItem[],
      _historyByEquipmentId: {} as Record<string, EquipmentStatusHistoryItem[]>,
      _metaById: {} as Record<string, EquipmentMeta>,
      _seeded: false,
      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        this._rows = [...SEED_CONNECTED_EQUIPMENT];
        this._historyByEquipmentId = Object.fromEntries(
          Object.entries(SEED_EQUIPMENT_HISTORY).map(([id, history]) => [
            id,
            history.map((item) => ({ ...item })),
          ]),
        );
      },
      getAll(): ConnectedEquipmentListItem[] {
        this._seed();
        return [...this._rows];
      },
      getById(id: string): ConnectedEquipmentListItem | undefined {
        this._seed();
        return this._rows.find((equipment) => equipment.id === id);
      },
      getDetailById(id: string): ConnectedEquipmentDetail | undefined {
        this._seed();
        const item = this._rows.find((equipment) => equipment.id === id);
        if (!item) return undefined;
        return buildEquipmentDetail(item, this._metaById[id]);
      },
      create(input: UpsertEquipmentRequest): ConnectedEquipmentDetail {
        this._seed();
        const nextNumber =
          this._rows.reduce((max, row) => {
            const parsed = Number.parseInt(row.id.replace(/^EQ-/, ''), 10);
            return Number.isNaN(parsed) ? max : Math.max(max, parsed);
          }, 0) + 1;
        const id = `EQ-${String(nextNumber).padStart(4, '0')}`;
        const now = new Date().toISOString();
        const row: ConnectedEquipmentListItem = {
          id,
          name: input.name,
          store_id: 'store-002',
          store_name: 'Fit365新宿店',
          controller_number: input.controller_number,
          qr_code_id: null,
          equipment_type: input.equipment_type,
          serial_number: input.serial_number,
          ip_address: input.ip_address ?? null,
          mac_address: input.mac_address ?? null,
          install_location: input.install_location,
          installed_on: input.installed_on,
          status: input.status,
          authentication_method: input.authentication_method ?? 'none',
          linked_contract_labels: buildLabelsFromRule(input.usage_control_rule),
          updated_at: now,
        };
        this._rows.push(row);
        this._metaById[id] = {
          controller_id: input.controller_id ?? null,
          remarks: input.remarks ?? null,
          usage_control_rule: input.usage_control_rule ?? null,
        };
        return buildEquipmentDetail(row, this._metaById[id]);
      },
      update(id: string, input: PatchEquipmentRequest): ConnectedEquipmentDetail | undefined {
        this._seed();
        const index = this._rows.findIndex((equipment) => equipment.id === id);
        if (index === -1) return undefined;
        const existing = this._rows[index];
        const nextRow: ConnectedEquipmentListItem = { ...existing };
        if (input.name !== undefined) nextRow.name = input.name;
        if (input.equipment_type !== undefined) nextRow.equipment_type = input.equipment_type;
        if (input.serial_number !== undefined) nextRow.serial_number = input.serial_number;
        if (input.install_location !== undefined) nextRow.install_location = input.install_location;
        if (input.installed_on !== undefined) nextRow.installed_on = input.installed_on;
        if (input.status !== undefined) nextRow.status = input.status;
        if (input.authentication_method !== undefined)
          nextRow.authentication_method = input.authentication_method ?? 'none';
        if (input.ip_address !== undefined) nextRow.ip_address = input.ip_address ?? null;
        if (input.mac_address !== undefined) nextRow.mac_address = input.mac_address ?? null;
        if (input.controller_number !== undefined)
          nextRow.controller_number = input.controller_number;
        if (input.usage_control_rule !== undefined)
          nextRow.linked_contract_labels = buildLabelsFromRule(input.usage_control_rule);
        nextRow.updated_at = new Date().toISOString();
        this._rows[index] = nextRow;
        const existingMeta = this._metaById[id] ?? {
          controller_id: null,
          remarks: null,
          usage_control_rule: null,
        };
        const nextMeta = { ...existingMeta };
        if (input.controller_id !== undefined) nextMeta.controller_id = input.controller_id ?? null;
        if (input.remarks !== undefined) nextMeta.remarks = input.remarks ?? null;
        if (input.usage_control_rule !== undefined)
          nextMeta.usage_control_rule = input.usage_control_rule ?? null;
        this._metaById[id] = nextMeta;
        return buildEquipmentDetail(this._rows[index], this._metaById[id]);
      },
      getHistory(id: string): EquipmentStatusHistoryItem[] {
        this._seed();
        if (!this._rows.some((equipment) => equipment.id === id)) return [];
        return [...(this._historyByEquipmentId[id] ?? [])];
      },
      delete(id: string): boolean {
        this._seed();
        const index = this._rows.findIndex((equipment) => equipment.id === id);
        if (index === -1) return false;
        this._rows.splice(index, 1);
        delete this._historyByEquipmentId[id];
        delete this._metaById[id];
        return true;
      },
      bulkUpdateStatus(
        ids: string[],
        status: ConnectedEquipmentListItem['status'],
      ): Array<{
        id: string;
        success: boolean;
        status?: ConnectedEquipmentListItem['status'];
        error?: string;
      }> {
        this._seed();
        const uniqueIds = [...new Set(ids)];
        const now = new Date().toISOString();
        return uniqueIds.map((id) => {
          const index = this._rows.findIndex((equipment) => equipment.id === id);
          if (index === -1) return { id, success: false, error: 'Equipment not found' };
          this._rows[index] = { ...this._rows[index], status, updated_at: now };
          return { id, success: true, status };
        });
      },
    },

    controllers: {
      _rows: [] as Controller[],
      _historyByControllerId: {} as Record<string, ControllerHistoryItem[]>,
      _seeded: false,
      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        this._rows = SEED_CONTROLLERS.map((controller) => ({ ...controller }));
        this._historyByControllerId = Object.fromEntries(
          Object.entries(SEED_CONTROLLER_HISTORY).map(([id, history]) => [
            id,
            history.map((item) => ({ ...item })),
          ]),
        );
      },
      getAll(): Controller[] {
        this._seed();
        return [...this._rows];
      },
      getById(controllerId: string): Controller | undefined {
        this._seed();
        return this._rows.find((controller) => controller.controller_id === controllerId);
      },
      getConnectedDevices(controllerId: string): {
        devices: ControllerConnectedDevice[];
        summary: ControllerDeviceSummary;
      } {
        this._seed();
        getDb().equipment._seed();
        const controller = this._rows.find((row) => row.controller_id === controllerId);
        if (!controller) return { devices: [], summary: buildControllerDeviceSummary([]) };
        const devices: ControllerConnectedDevice[] = getDb()
          .equipment._rows.filter((equipment) => {
            const meta = getDb().equipment._metaById[equipment.id];
            if (meta?.controller_id) return meta.controller_id === controllerId;
            return equipment.controller_number === controller.controller_number;
          })
          .map((equipment) => ({
            equipment_id: equipment.id,
            name: equipment.name,
            controller_number: equipment.controller_number,
            gate_type: equipment.equipment_type === 'entry_gate' ? '入退館ゲート' : null,
            status: equipment.status,
          }));
        return { devices, summary: buildControllerDeviceSummary(devices) };
      },
      list(query: GetControllersQuery): GetControllersResponse {
        this._seed();
        const { search, status, store_id, sort_by, sort_order, page, limit } = query;
        let rows = [...this._rows];
        if (search) {
          const normalized = search.toLowerCase();
          rows = rows.filter((row) =>
            [row.name ?? '', row.ip_address, row.controller_id, row.location].some((value) =>
              value.toLowerCase().includes(normalized),
            ),
          );
        }
        if (status) rows = rows.filter((row) => row.status === status);
        if (store_id && store_id !== 'all')
          rows = rows.filter((row) => row.store_code === store_id);
        const withCounts: ControllerListItem[] = rows.map((row) => ({
          ...row,
          device_count: this.getConnectedDevices(row.controller_id).devices.length,
        }));
        const sorters: Record<
          GetControllersQuery['sort_by'],
          (left: ControllerListItem, right: ControllerListItem) => number
        > = {
          controller_id: (left, right) => left.controller_id.localeCompare(right.controller_id),
          name: (left, right) => (left.name ?? '').localeCompare(right.name ?? '', 'ja'),
          store_code: (left, right) => left.store_code.localeCompare(right.store_code),
          location: (left, right) => left.location.localeCompare(right.location, 'ja'),
          ip_address: (left, right) => left.ip_address.localeCompare(right.ip_address),
          firmware_version: (left, right) =>
            (left.firmware_version ?? '').localeCompare(right.firmware_version ?? ''),
          control_port_count: (left, right) => left.control_port_count - right.control_port_count,
          device_count: (left, right) => left.device_count - right.device_count,
          status: (left, right) => left.status.localeCompare(right.status),
        };
        withCounts.sort((left, right) => {
          const comparison = sorters[sort_by](left, right);
          return sort_order === 'desc' ? -comparison : comparison;
        });
        const total = withCounts.length;
        const total_pages = total === 0 ? 0 : Math.ceil(total / limit);
        const startIndex = (page - 1) * limit;
        return {
          items: withCounts.slice(startIndex, startIndex + limit),
          total,
          page,
          limit,
          total_pages,
        };
      },
      getDetailById(controllerId: string): ControllerDetail | undefined {
        this._seed();
        const controller = this._rows.find((row) => row.controller_id === controllerId);
        if (!controller) return undefined;
        const { devices, summary } = this.getConnectedDevices(controllerId);
        return { ...controller, device_count: devices.length, device_summary: summary };
      },
      getHistory(controllerId: string): ControllerHistoryItem[] {
        this._seed();
        if (!this._rows.some((row) => row.controller_id === controllerId)) return [];
        return [...(this._historyByControllerId[controllerId] ?? [])];
      },
      create(input: UpsertControllerRequest): ControllerDetail {
        this._seed();
        const nextNumber =
          this._rows.reduce((max, row) => {
            const parsed = Number.parseInt(row.controller_id.replace(/^CTRL-/, ''), 10);
            return Number.isNaN(parsed) ? max : Math.max(max, parsed);
          }, 0) + 1;
        const controllerId = `CTRL-${String(nextNumber).padStart(3, '0')}`;
        const controllerNumber =
          this._rows.reduce((max, row) => Math.max(max, row.controller_number), 0) + 1;
        const now = new Date().toISOString();
        const row: Controller = {
          controller_id: controllerId,
          controller_number: controllerNumber,
          name: input.name,
          store_code: input.store_code,
          location: input.location,
          ip_address: input.ip_address,
          port: input.port,
          firmware_version: input.firmware_version ?? null,
          control_port_count: input.control_port_count,
          status: input.status,
          created_at: now,
          updated_at: now,
        };
        this._rows.push(row);
        this._historyByControllerId[controllerId] = [];
        return { ...row, device_count: 0, device_summary: buildControllerDeviceSummary([]) };
      },
      update(controllerId: string, input: PatchControllerRequest): ControllerDetail | undefined {
        this._seed();
        const index = this._rows.findIndex((row) => row.controller_id === controllerId);
        if (index === -1) return undefined;
        const existing = this._rows[index];
        const nextRow: Controller = { ...existing };
        if (input.name !== undefined) nextRow.name = input.name;
        if (input.store_code !== undefined) nextRow.store_code = input.store_code;
        if (input.location !== undefined) nextRow.location = input.location;
        if (input.ip_address !== undefined) nextRow.ip_address = input.ip_address;
        if (input.port !== undefined) nextRow.port = input.port;
        if (input.firmware_version !== undefined)
          nextRow.firmware_version = input.firmware_version ?? null;
        if (input.control_port_count !== undefined)
          nextRow.control_port_count = input.control_port_count;
        if (input.status !== undefined) nextRow.status = input.status;
        nextRow.updated_at = new Date().toISOString();
        this._rows[index] = nextRow;
        const { devices, summary } = this.getConnectedDevices(controllerId);
        return { ...nextRow, device_count: devices.length, device_summary: summary };
      },
      delete(
        controllerId: string,
      ): { ok: true } | { ok: false; reason: 'has_connected_devices'; device_count: number } {
        this._seed();
        const index = this._rows.findIndex((row) => row.controller_id === controllerId);
        if (index === -1) return { ok: true };
        const { devices } = this.getConnectedDevices(controllerId);
        if (devices.length > 0)
          return { ok: false, reason: 'has_connected_devices', device_count: devices.length };
        this._rows.splice(index, 1);
        delete this._historyByControllerId[controllerId];
        return { ok: true };
      },
    },

    visitExperiences: {
      _rows: [] as VisitExperienceDetail[],
      _seeded: false,
      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        this._rows = [...SEED_VISIT_EXPERIENCES];
      },
      getAll(): VisitExperienceDetail[] {
        this._seed();
        return [...this._rows];
      },
      getById(id: string): VisitExperienceDetail | undefined {
        this._seed();
        return this._rows.find((ve) => ve.id === id);
      },
      update(id: string, record: VisitExperienceDetail): void {
        this._seed();
        const idx = this._rows.findIndex((ve) => ve.id === id);
        if (idx !== -1) this._rows[idx] = record;
      },
    },
  };
}
