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
  MembersCreate = 'members.create',
  MembersEdit = 'members.edit',
  MembersDelete = 'members.delete',
  MembersPersonalDataEdit = 'members.personal-data-edit',
  MembersPersonalDataDelete = 'members.personal-data-delete',
  MembersReEnroll = 'members.re-enroll',
  MembersSuspend = 'members.suspend',
  MembersWithdraw = 'members.withdraw',
  MembersTransfer = 'members.transfer',
  MembersGateStop = 'members.gate-stop',
  MembersForceWithdraw = 'members.force-withdraw',

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
  LeavesApprove = 'leaves.approve',

  // -------------------------------------------------------------------------
  // Members — Transfers
  // -------------------------------------------------------------------------
  MembersTransfersView = 'members.transfers-view',
  TransfersApprove = 'transfers.approve',

  // -------------------------------------------------------------------------
  // Membership applications
  // -------------------------------------------------------------------------
  MembershipApplicationsView = 'membership-applications.view',
  MembershipApplicationsCreate = 'membership-applications.create',
  MembershipApplicationsApprove = 'membership-applications.approve',

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
  LockersContractsCreate = 'lockers-contracts.create',
  LockersContractsEdit = 'lockers-contracts.edit',
  LockersContractsExport = 'lockers-contracts.export',

  // -------------------------------------------------------------------------
  // Surveys
  // -------------------------------------------------------------------------
  SurveysView = 'surveys.view',
  SurveysEdit = 'surveys.edit',
  SurveysCreate = 'surveys.create',
  SurveysDelete = 'surveys.delete',

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
  // Terms
  // -------------------------------------------------------------------------
  TermsView = 'terms.view',
  TermsCreate = 'terms.create',
  TermsEdit = 'terms.edit',
  TermsDelete = 'terms.delete',
}

/** Authenticated user stored in context */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  position: string;
}
