import type { DbType } from './_db.types';
import { createAppMaintenanceTables } from './tables/app-maintenance.table';
import { createAppVersionTables } from './tables/app-version.table';
import { createArticleCategoryTables } from './tables/article-category.table';
import { createBannerTables } from './tables/banner.table';
import { createBillingTables } from './tables/billing.table';
import { createBlacklistTables } from './tables/blacklist.table';
import { createBrandTables } from './tables/brand.table';
import { createCampaignTables } from './tables/campaign.table';
import { createCrmMaintenanceTables } from './tables/crm-maintenance.table';
import { createEntryExitLogTables } from './tables/entry-exit-log.table';
import { createEquipmentTables } from './tables/equipment.table';
import { createExerciseMasterTables } from './tables/exercise-master.table';
import { createExercisesTables } from './tables/exercise.table';
import { createFranchiseTables } from './tables/franchise.table';
import { createLessonTables } from './tables/lesson.table';
import { createLockerTables } from './tables/locker.table';
import { createManualNotificationTable } from './tables/manual-notification.table';
import { createMemberLeaveTables } from './tables/member-leave.table';
import { createMembersTables } from './tables/members.table';
import { createMembershipApplicationTables } from './tables/membership-application.table';
import { createOptionTables } from './tables/option.table';
import { createPositionTables } from './tables/position.table';
import { createRoutineCategoryTables } from './tables/routine-category.table';
import { createRoutineTables } from './tables/routine.table';
import { createStaffTables } from './tables/staff.table';
import { createStoreTables } from './tables/store.table';
import { createTermsTables } from './tables/terms.table';
import { createTrainingEquipmentTables } from './tables/training-equipment.table';
import { createTransferTables } from './tables/transfer.table';

export function createDb(): DbType {
  const db = {} as DbType;

  Object.assign(db, createBannerTables());
  Object.assign(db, createArticleCategoryTables());
  Object.assign(db, createAppMaintenanceTables());
  Object.assign(db, createTermsTables());
  Object.assign(db, createAppVersionTables());
  Object.assign(
    db,
    createMembersTables(() => db),
  );
  Object.assign(
    db,
    createMembershipApplicationTables(() => db),
  );
  Object.assign(
    db,
    createBillingTables(() => db),
  );
  Object.assign(db, createBrandTables());
  Object.assign(db, createCampaignTables());
  Object.assign(
    db,
    createCrmMaintenanceTables(() => db),
  );

  Object.assign(
    db,
    createOptionTables(() => db),
  );
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
  Object.assign(
    db,
    createPositionTables(() => db),
  );
  Object.assign(db, createFranchiseTables());
  Object.assign(
    db,
    createTransferTables(() => db),
  );
  Object.assign(
    db,
    createMemberLeaveTables(() => db),
  );
  Object.assign(
    db,
    createBlacklistTables(() => db),
  );
  Object.assign(
    db,
    createEquipmentTables(() => db),
  );
  Object.assign(
    db,
    createExercisesTables(() => db),
  );
  Object.assign(
    db,
    createExerciseMasterTables(() => db),
  );
  Object.assign(
    db,
    createTrainingEquipmentTables(() => db),
  );
  Object.assign(
    db,
    createLessonTables(() => db),
  );
  Object.assign(
    db,
    createManualNotificationTable(() => db),
  );
  Object.assign(
    db,
    createEntryExitLogTables(() => db),
  );
  Object.assign(db, createRoutineCategoryTables());
  Object.assign(
    db,
    createRoutineTables(() => db),
  );

  // Seed mock data immediately when the singleton is first created
  db.banners._seed();
  db.articleCategories._seed();
  db.articleCategoryMappings._seed();
  db.appMaintenances._seed();
  db.terms._seed();
  db.crmMaintenances._seed();
  db.mainContracts._seed();
  db.campaigns._seed();
  db.storeCampaignLinks._seed();
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
  db.exercises._seed();
  db.exerciseMasters._seed();
  db.visitExperiences._seed();
  db.franchiseCompanies._seed();
  db.users._seed();
  db.lessonSchedules._seed();
  db.reservations._seed();
  db.manualNotifications._seed();
  db.entryExitLogs._seed();
  db.billingRecords._seed();
  db.routineCategories._seed();
  db.routines._seed();
  db.appVersions._seed();

  return db;
}
