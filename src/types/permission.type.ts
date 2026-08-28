/** All roles in the system */
export enum UserRole {
  System = 'System',
  Headquarter = 'Headquarter',
  Manager = 'Manager',
  Staff = 'Staff',
  Trainer = 'Trainer',
  Observer = 'Observer',
}

/**
 * Fine-grained permissions grouped by screen/resource.
 * Format: "<resource>.<action>"
 * Extend this enum as new features are added.
 */
export enum Permission {
  // -------------------------------------------------------------------------
  // Staffs
  // -------------------------------------------------------------------------
  StaffsView = 'staffs.view',
  StaffsCreate = 'staffs.create',
  StaffsEdit = 'staffs.edit',
  StaffsDelete = 'staffs.delete',
  StaffsInvite = 'staffs.invite',

  // -------------------------------------------------------------------------
  // Stores
  // -------------------------------------------------------------------------
  StoresView = 'stores.view',
  StoresCreate = 'stores.create',
  StoresEdit = 'stores.edit',
  StoresDelete = 'stores.delete',
  StoresConfigContract = 'stores.config-contract',
  StoresConfigAccess = 'stores.config-access',
  StoresConfigBusiness = 'stores.config-business',

  // -------------------------------------------------------------------------
  // Positions
  // -------------------------------------------------------------------------
  PositionsView = 'positions.view',
  PositionsCreate = 'positions.create',
  PositionsEdit = 'positions.edit',
  PositionsDelete = 'positions.delete',

  // -------------------------------------------------------------------------
  // Members
  // -------------------------------------------------------------------------
  MembersView = 'members.view',
  MembersEdit = 'members.edit',
  MembersDelete = 'members.delete',
  MembersPersonalDataDelete = 'members.personal-data-delete',
  MembersReEnroll = 'members.re-enroll',
  MembersSuspend = 'members.suspend',
  MembersWithdraw = 'members.withdraw',
  MembersTransfer = 'members.transfer',
  MembersGateStop = 'members.gate-stop',
  MembersForceWithdraw = 'members.force-withdraw',
  MembersOptionContractOperate = 'members.option-contract-operate',

  // -------------------------------------------------------------------------
  // Members — Blacklist
  // -------------------------------------------------------------------------
  MembersBlacklistView = 'members.blacklist-view',
  BlacklistCreate = 'blacklist.create',
  BlacklistDelete = 'blacklist.delete',

  // -------------------------------------------------------------------------
  // Members — Leaves
  // -------------------------------------------------------------------------
  MembersLeavesView = 'members.leaves-view',

  // -------------------------------------------------------------------------
  // Members — Transfers
  // -------------------------------------------------------------------------
  MembersTransfersView = 'members.transfers-view',
  /** A-02 権限マトリクス: System / Headquarter / Manager / Staff. Row-level scope is narrowed
   *  further for Staff by `canActOnTransfer` — approve rights alone are not enough. */
  MembersTransfersApprove = 'members.transfers-approve',
  /** A-02 FR-013: System / Headquarter / Manager only. */
  MembersTransfersBulkApprove = 'members.transfers-bulk-approve',
  /** A-02 FR-012 手動解除: System / Headquarter / Manager only. */
  MembersTransfersUnlock = 'members.transfers-unlock',

  // -------------------------------------------------------------------------
  // Membership applications
  // -------------------------------------------------------------------------
  MembershipApplicationsView = 'membership-applications.view',
  MembershipApplicationsCreate = 'membership-applications.create',
  MembershipApplicationsApprove = 'membership-applications.approve',
  /** C-01: 入会取り消し, separate from 承認・否認 — Staff hold it unconditionally. */
  MembershipApplicationsCancel = 'membership-applications.cancel',

  // -------------------------------------------------------------------------
  // Visit / experience management
  // -------------------------------------------------------------------------
  VisitExperiencesView = 'visit-experiences.view',

  // -------------------------------------------------------------------------
  // Family registrations
  // -------------------------------------------------------------------------
  FamilyRegistrationsView = 'family-registrations.view',
  FamilyRegistrationsDashboardView = 'family-registrations.dashboard-view',
  FamilyRegistrationsApprove = 'family-registrations.approve',

  // -------------------------------------------------------------------------
  // Contracts
  // -------------------------------------------------------------------------
  ContractsView = 'contracts.view',
  ContractsEdit = 'contracts.edit',
  ContractsDelete = 'contracts.delete',
  ContractsCreate = 'contracts.create',

  // -------------------------------------------------------------------------
  // Campaigns
  // -------------------------------------------------------------------------
  CampaignsView = 'campaigns.view',
  CampaignsCreate = 'campaigns.create',
  CampaignsEdit = 'campaigns.edit',
  CampaignsPromoCodeEdit = 'campaigns-promo-code.edit',
  CampaignsPromoCodeCreate = 'campaigns-promo-code.create',
  CampaignsPromoCodeDelete = 'campaigns-promo-code.delete',
  CampaignsPromoCodeExport = 'campaigns-promo-code.export',

  // -------------------------------------------------------------------------
  // Franchise companies
  // -------------------------------------------------------------------------
  FCCompaniesView = 'fc-companies.view',
  FCCompaniesCreate = 'fc-companies.create',
  FCCompaniesEdit = 'fc-companies.edit',
  FCCompaniesDelete = 'fc-companies.delete',

  // -------------------------------------------------------------------------
  // Options
  // -------------------------------------------------------------------------
  OptionsView = 'options.view',
  OptionsEdit = 'options.edit',
  OptionsCreate = 'options.create',
  OptionsDelete = 'options.delete',

  // -------------------------------------------------------------------------
  // Option discounts
  // -------------------------------------------------------------------------
  OptionDiscountsView = 'option-discounts.view',
  OptionDiscountsEdit = 'option-discounts.edit',
  OptionDiscountsCreate = 'option-discounts.create',
  OptionDiscountsDelete = 'option-discounts.delete',

  // -------------------------------------------------------------------------
  // Brands
  // -------------------------------------------------------------------------
  BrandsView = 'brands.view',
  BrandsEdit = 'brands.edit',
  BrandsCreate = 'brands.create',

  // -------------------------------------------------------------------------
  // Lockers
  // -------------------------------------------------------------------------
  LockersView = 'lockers.view',
  LockersEdit = 'lockers.edit',
  LockersCreate = 'lockers.create',
  LockersDelete = 'lockers.delete',
  LockersExport = 'lockers.export',
  LockersPendingView = 'lockers-pending.view',
  LockersPendingExport = 'lockers-pending.export',
  LockersContractsView = 'lockers-contracts.view',
  LockersContractsEdit = 'lockers-contracts.edit',
  LockersContractsExport = 'lockers-contracts.export',

  // -------------------------------------------------------------------------
  // Surveys
  // -------------------------------------------------------------------------
  SurveysView = 'surveys.view',
  SurveysEdit = 'surveys.edit',
  SurveysCreate = 'surveys.create',
  SurveysDelete = 'surveys.delete',

  // -------------------------------------------------------------------------
  // Banners
  // -------------------------------------------------------------------------
  BannersView = 'banners.view',
  BannersCreate = 'banners.create',
  BannersEdit = 'banners.edit',
  BannersDelete = 'banners.delete',
  BannersReorder = 'banners.reorder',

  // Manual notification delivery (I-03)
  ManualNotificationsView = 'manual-notifications.view',
  ManualNotificationsCreate = 'manual-notifications.create',
  ManualNotificationsEdit = 'manual-notifications.edit',
  ManualNotificationsDelete = 'manual-notifications.delete',
  ManualNotificationsApprove = 'manual-notifications.approve',

  // Lessons / Reservations (D-01)
  // -------------------------------------------------------------------------
  LessonsView = 'lessons.view',
  LessonsScheduleManage = 'lessons.schedule-manage',
  LessonsReservationManage = 'lessons.reservation-manage',
  LessonsAttendanceManage = 'lessons.attendance-manage',
  LessonsMemoManage = 'lessons.memo-manage',
  LessonsPenaltyRelease = 'lessons.penalty-release',

  // -------------------------------------------------------------------------
  // Lesson Content Management (D-02)
  // Distinct from the D-01 Lessons* (schedule/reservation) permissions above.
  // -------------------------------------------------------------------------
  LessonContentsView = 'lesson-contents.view',
  LessonContentsCreate = 'lesson-contents.create',
  LessonContentsEdit = 'lesson-contents.edit',
  LessonContentsDelete = 'lesson-contents.delete',
  LessonContentsHistoryView = 'lesson-contents.history-view',

  // -------------------------------------------------------------------------
  // Exercises
  // -------------------------------------------------------------------------
  ExercisesView = 'exercises.view',
  ExercisesCreate = 'exercises.create',
  ExercisesEdit = 'exercises.edit',
  ExercisesDelete = 'exercises.delete',
  ExercisesPublish = 'exercises.publish',

  // -------------------------------------------------------------------------
  // Equipment
  // -------------------------------------------------------------------------
  EquipmentView = 'equipment.view',
  EquipmentCreate = 'equipment.create',
  EquipmentEdit = 'equipment.edit',
  EquipmentDelete = 'equipment.delete',
  EquipmentExport = 'equipment.export',

  // -------------------------------------------------------------------------
  // Controllers
  // -------------------------------------------------------------------------
  ControllerView = 'controller.view',
  ControllerCreate = 'controller.create',
  ControllerEdit = 'controller.edit',
  ControllerDelete = 'controller.delete',
  ControllerExport = 'controller.export',

  // -------------------------------------------------------------------------
  // Studios (D-03)
  // -------------------------------------------------------------------------
  StudiosView = 'studios.view',
  StudiosCreate = 'studios.create',
  StudiosEdit = 'studios.edit',
  StudiosDelete = 'studios.delete',

  // -------------------------------------------------------------------------
  // Training Equipment
  // -------------------------------------------------------------------------
  TrainingEquipmentView = 'training-equipment.view',
  TrainingEquipmentEdit = 'training-equipment.edit',
  TrainingEquipmentCreate = 'training-equipment.create',
  TrainingEquipmentDelete = 'training-equipment.delete',
  TrainingEquipmentExport = 'training-equipment.export',
  TrainingEquipmentExerciseLinks = 'training-equipment.exercise-links',

  // -------------------------------------------------------------------------
  // Instructors (D-04)
  // -------------------------------------------------------------------------
  InstructorsView = 'instructors.view',
  InstructorsCreate = 'instructors.create',
  InstructorsEdit = 'instructors.edit',
  InstructorsDelete = 'instructors.delete',

  // -------------------------------------------------------------------------
  // Entry / Exit management
  // -------------------------------------------------------------------------
  EntryExitView = 'entry-exit.view',
  EntryExitHistoryView = 'entry-exit-history.view',
  EntryExitHistoryExport = 'entry-exit-history.export',

  // -------------------------------------------------------------------------
  // Article Categories
  // -------------------------------------------------------------------------
  ArticleCategoriesView = 'article-categories.view',
  ArticleCategoriesCreate = 'article-categories.create',
  ArticleCategoriesEdit = 'article-categories.edit',
  ArticleCategoriesDelete = 'article-categories.delete',

  // -------------------------------------------------------------------------
  // App Version Management (Y-05)
  // -------------------------------------------------------------------------
  AppVersionsView = 'app-versions.view',
  AppVersionsCreate = 'app-versions.create',
  AppVersionsEdit = 'app-versions.edit',
  AppVersionsDelete = 'app-versions.delete',

  // -------------------------------------------------------------------------
  // App Maintenance
  // -------------------------------------------------------------------------
  AppMaintenanceView = 'app-maintenance.view',
  AppMaintenanceCreate = 'app-maintenance.create',
  AppMaintenanceEdit = 'app-maintenance.edit',
  AppMaintenanceDelete = 'app-maintenance.delete',

  // -------------------------------------------------------------------------
  // Terms Document Master Management (Y-04)
  // -------------------------------------------------------------------------
  TermsView = 'terms.view',
  TermsCreate = 'terms.create',
  TermsEdit = 'terms.edit',
  TermsDelete = 'terms.delete',

  // Sales Management (F-01)
  // -------------------------------------------------------------------------
  SalesView = 'sales.view',
  SalesConfirm = 'sales.confirm',
  SalesRefundInitiate = 'sales.refund-initiate',
  SalesLineItemAdd = 'sales.line-item-add',
  SalesFeeAdjust = 'sales.fee-adjust',
  SalesManualRegister = 'sales.manual-register',
  SalesExport = 'sales.export',

  // -------------------------------------------------------------------------
  // Sales — Transaction History, Receivables, Refund Management (F-01-01/02/03)
  // -------------------------------------------------------------------------
  SalesTransactionsView = 'sales.transactions-view',
  SalesReceivablesView = 'sales.receivables-view',
  SalesRefundsView = 'sales.refunds-view',
  SalesBadDebtExclude = 'sales.bad-debt-exclude',
  SalesConvenienceIssue = 'sales.convenience-issue',
  SalesUpcomingBillingConfirm = 'sales.upcoming-billing-confirm',
  SalesRefundApprove = 'sales.refund-approve',
  SalesRefundExport = 'sales.refund-export',

  // -------------------------------------------------------------------------
  // Routines (Y-09)
  // -------------------------------------------------------------------------
  RoutinesView = 'routines.view',
  RoutinesCreate = 'routines.create',
  RoutinesEdit = 'routines.edit',
  RoutinesDelete = 'routines.delete',
  RoutinesPublish = 'routines.publish',

  // -------------------------------------------------------------------------
  // CRM Maintenance (Y-10) — System writes; System + Headquarter read
  // -------------------------------------------------------------------------
  CrmMaintenanceView = 'crm-maintenance.view',
  CrmMaintenanceCreate = 'crm-maintenance.create',
  CrmMaintenanceEdit = 'crm-maintenance.edit',
  CrmMaintenanceDelete = 'crm-maintenance.delete',
  CrmMaintenanceNotify = 'crm-maintenance.notify',
}

/** Authenticated user stored in context */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  position: string;
  /** Caller's own StaffListItem.id (empty string if no linked staff record) */
  staffId: string;
  /** Store IDs this Manager oversees; populated only when role=Manager */
  managedStoreIds?: string[];
}
