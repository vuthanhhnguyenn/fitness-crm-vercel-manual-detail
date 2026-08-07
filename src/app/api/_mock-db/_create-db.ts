import type { DbType } from './_db.types';
import { createBrandTables } from './tables/brand.table';
import { createEquipmentTables } from './tables/equipment.table';
import { createFranchiseTables } from './tables/franchise.table';
import { createLessonTables } from './tables/lesson.table';
import { createLockerTables } from './tables/locker.table';
import { createManualNotificationTable } from './tables/manual-notification.table';
import { createMembersTables } from './tables/members.table';
import { createOptionTables } from './tables/option.table';
import { createStaffTables } from './tables/staff.table';
import { createStoreTables } from './tables/store.table';
import { createTermsTables } from './tables/terms.table';
import { createTrainingEquipmentTables } from './tables/training-equipment.table';
import { createTransferTables } from './tables/transfer.table';

export function createDb(): DbType {
  const db = {} as DbType;

  Object.assign(
    db,
    createMembersTables(() => db),
  );
  Object.assign(
    db,
    createBrandTables(() => db),
  );
  Object.assign(db, createOptionTables());
  Object.assign(
    db,
    createStoreTables(() => db),
  );
  Object.assign(
    db,
    createLockerTables(() => db),
  );
  Object.assign(
    db,
    createStaffTables(() => db),
  );
  Object.assign(db, createFranchiseTables());
  Object.assign(
    db,
    createTransferTables(() => db),
  );
  Object.assign(
    db,
    createEquipmentTables(() => db),
  );
  Object.assign(
    db,
    createTrainingEquipmentTables(() => db),
  );
  Object.assign(
    db,
    createLessonTables(() => db),
  );
  Object.assign(db, createTermsTables());
  Object.assign(db, createManualNotificationTable());

  // Seed mock data immediately when the singleton is first created
  db.mainContracts._seed();
  db.campaigns._seed();
  db.promoCodes._seed();
  db.members._seed();
  db.contracts._seed();
  db.membershipApplications._seed();
  db.family._seed();
  db.staffs._seed();
  db.enrollmentFeeMasters._seed();
  db.corporateMasters._seed();
  db.partnerCompanies._seed();
  db.equipment._seed();
  db.toolTypes._seed();
  db.trainingEquipment._seed();
  db.terms._seed();
  db.visitExperiences._seed();
  db.franchiseCompanies._seed();
  db.users._seed();
  db.lessonSchedules._seed();
  db.reservations._seed();
  db.manualNotifications._seed();

  return db;
}
