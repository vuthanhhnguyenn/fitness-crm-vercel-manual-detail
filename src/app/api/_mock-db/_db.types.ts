import type {
  AppMaintenancesType,
  AppVersionsType,
  ArticleCategoriesType,
  ArticleCategoryMappingsType,
  BannersType,
  BillingRecordsType,
  BrandsType,
  BusinessHoursType,
  CampaignsType,
  ContractsType,
  ControllersType,
  CorporateMastersType,
  CrmMaintenancesType,
  EnrollmentFeeMastersType,
  EntryExitLogsType,
  EquipmentType,
  ExerciseMastersType,
  ExercisesType,
  FamilyType,
  FranchiseCompaniesType,
  GetMemberRelationshipsType,
  InstructorsType,
  LessonContentDetailsType,
  LessonContentHistoryType,
  LessonContentSchedulesType,
  LessonContentsType,
  LessonSchedulesType,
  LessonsType,
  LockerContractsType,
  LockerPendingSlotsType,
  LockersType,
  MainContractsType,
  ManualNotificationsType,
  MemberBlacklistType,
  MemberLeavesType,
  MembersType,
  MembershipApplicationsType,
  OptionDiscountType,
  OptionMastersType,
  PartnerCompaniesType,
  PersonalPlansType,
  PositionsType,
  PromoCodesType,
  ReferralsType,
  ReservationsType,
  RoutineCategoriesType,
  RoutinesType,
  StaffPermissionsType,
  StaffsType,
  StoreAccessSettingsType,
  StoreCampaignLinksType,
  StoreHolidaysType,
  StoreMainContractsType,
  StoreOptionsType,
  StoresType,
  StudiosType,
  SurveyReportingType,
  SurveyVisibilityType,
  SurveysType,
  TemplatesType,
  TermsType,
  ToolTypesType,
  TrainingEquipmentType,
  TransfersType,
  UsersType,
  VisitExperiencesType,
} from './types';

export type DbType = {
  members: MembersType;
  contracts: ContractsType;
  membershipApplications: MembershipApplicationsType;
  family: FamilyType;
  referrals: ReferralsType;
  getMemberRelationships: GetMemberRelationshipsType;
  mainContracts: MainContractsType;
  campaigns: CampaignsType;
  storeCampaignLinks: StoreCampaignLinksType;
  promoCodes: PromoCodesType;
  optionMasters: OptionMastersType;
  surveys: SurveysType;
  surveyReporting: SurveyReportingType;
  surveyVisibility: SurveyVisibilityType;
  optionDiscount: OptionDiscountType;
  storeMainContracts: StoreMainContractsType;
  storeOptions: StoreOptionsType;
  positions: PositionsType;
  stores: StoresType;
  lockers: LockersType;
  lockerContracts: LockerContractsType;
  lockerPendingSlots: LockerPendingSlotsType;
  businessHours: BusinessHoursType;
  store_access_settings: StoreAccessSettingsType;
  staff_permissions: StaffPermissionsType;
  brands: BrandsType;
  franchiseCompanies: FranchiseCompaniesType;
  staffs: StaffsType;
  transfers: TransfersType;
  memberLeaves: MemberLeavesType;
  memberBlacklist: MemberBlacklistType;
  enrollmentFeeMasters: EnrollmentFeeMastersType;
  corporateMasters: CorporateMastersType;
  partnerCompanies: PartnerCompaniesType;
  equipment: EquipmentType;
  toolTypes: ToolTypesType;
  trainingEquipment: TrainingEquipmentType;
  exercises: ExercisesType;
  exerciseMasters: ExerciseMastersType;
  controllers: ControllersType;
  visitExperiences: VisitExperiencesType;
  users: UsersType;
  lessonSchedules: LessonSchedulesType;
  studios: StudiosType;
  lessons: LessonsType;
  lessonContents: LessonContentsType;
  personalPlans: PersonalPlansType;
  lessonContentDetails: LessonContentDetailsType;
  lessonContentSchedules: LessonContentSchedulesType;
  lessonContentHistory: LessonContentHistoryType;
  instructors: InstructorsType;
  templates: TemplatesType;
  storeHolidays: StoreHolidaysType;
  reservations: ReservationsType;
  entryExitLogs: EntryExitLogsType;
  billingRecords: BillingRecordsType;
  routines: RoutinesType;
  routineCategories: RoutineCategoriesType;
  appVersions: AppVersionsType;
  manualNotifications: ManualNotificationsType;
  banners: BannersType;
  articleCategories: ArticleCategoriesType;
  articleCategoryMappings: ArticleCategoryMappingsType;
  appMaintenances: AppMaintenancesType;
  terms: TermsType;
  crmMaintenances: CrmMaintenancesType;
};
