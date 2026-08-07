import type {
  BrandsType,
  BusinessHoursType,
  CampaignsType,
  ContractsType,
  ControllersType,
  CorporateMastersType,
  EnrollmentFeeMastersType,
  EquipmentType,
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
  StaffPermissionsType,
  StaffsType,
  StoreAccessSettingsType,
  StoreHolidaysType,
  StoreMainContractsType,
  StoreOptionsType,
  StoresType,
  StudiosType,
  SurveyReportingType,
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
  promoCodes: PromoCodesType;
  optionMasters: OptionMastersType;
  surveys: SurveysType;
  surveyReporting: SurveyReportingType;
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
  terms: TermsType;
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
  manualNotifications: ManualNotificationsType;
};
