/**
 * Register all schemas with OpenAPI registry
 * This ensures schemas are extracted to components/schemas instead of being inline
 */
// Import all schemas
import * as authSchemas from '../_schemas/auth.schema';
import * as autoApprovalSchemas from '../_schemas/auto-approval.schema';
import * as blacklistSchemas from '../_schemas/blacklist.schema';
import * as brandSchemas from '../_schemas/brand.schema';
import * as campaignSchemas from '../_schemas/campaign.schema';
import * as controllerSchemas from '../_schemas/controller.schema';
import * as equipmentSchemas from '../_schemas/equipment.schema';
import * as familyRegistrationSchemas from '../_schemas/family-registration.schema';
import * as franchiseCompanySchemas from '../_schemas/franchise-company.schema';
import * as leaveSchemas from '../_schemas/leave.schema';
import * as lessonContentSchemas from '../_schemas/lesson-content.schema';
import * as lessonReservationSchemas from '../_schemas/lesson-reservation.schema';
import * as lessonScheduleSchemas from '../_schemas/lesson-schedule.schema';
import * as lockerSchemas from '../_schemas/locker.schema';
import * as mainContractSchemas from '../_schemas/main-contract.schema';
import * as manualNotificationSchemas from '../_schemas/manual-notification.schema';
import * as memberSchemas from '../_schemas/member.schema';
import * as membershipApplicationSchemas from '../_schemas/membership-application.schema';
import * as optionDiscountSchemas from '../_schemas/option-discount.schema';
import * as optionMasterSchemas from '../_schemas/option-master.schema';
import * as positionSchemas from '../_schemas/position.schema';
import * as promoCodeSchemas from '../_schemas/promo-code.schema';
import * as staffSchemas from '../_schemas/staff.schema';
import * as storeAccessSettingsSchemas from '../_schemas/store-access-settings.schema';
import * as storeSchemas from '../_schemas/store.schema';
import * as studioDetailSchemas from '../_schemas/studio-detail.schema';
import * as surveySchemas from '../_schemas/survey.schema';
import * as trainingEquipmentSchemas from '../_schemas/training-equipment.schema';
import * as visitExperienceSchemas from '../_schemas/visit-experience.schema';
import { registry } from './registry';

/**
 * Map to store registered schemas by their name
 * This allows routes to use the registered schemas which will generate $ref
 */
export const registeredSchemaMap = new Map<string, any>();

/**
 * Register all schemas with the registry
 * This must be called before registering routes
 */
export function registerAllSchemas() {
  registeredSchemaMap.set(
    'ManualNotificationDetail',
    registry.register(
      'ManualNotificationDetail',
      manualNotificationSchemas.ManualNotificationDetailSchema,
    ),
  );
  registeredSchemaMap.set(
    'GetManualNotificationDetailResponse',
    registry.register(
      'GetManualNotificationDetailResponse',
      manualNotificationSchemas.GetManualNotificationDetailResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'ManualNotificationUpsertBody',
    registry.register(
      'ManualNotificationUpsertBody',
      manualNotificationSchemas.ManualNotificationUpsertBodySchema,
    ),
  );
  registeredSchemaMap.set(
    'ManualNotificationUpsertResponse',
    registry.register(
      'ManualNotificationUpsertResponse',
      manualNotificationSchemas.ManualNotificationUpsertResponseSchema,
    ),
  );
  // Register auth schemas
  registeredSchemaMap.set(
    'LoginRequest',
    registry.register('LoginRequest', authSchemas.LoginRequestSchema),
  );
  registeredSchemaMap.set(
    'LoginResponse',
    registry.register('LoginResponse', authSchemas.LoginResponseSchema),
  );
  registeredSchemaMap.set('Token', registry.register('Token', authSchemas.TokenSchema));
  registeredSchemaMap.set(
    'RefreshRequest',
    registry.register('RefreshRequest', authSchemas.RefreshRequestSchema),
  );
  registeredSchemaMap.set(
    'RefreshResponse',
    registry.register('RefreshResponse', authSchemas.RefreshResponseSchema),
  );
  registeredSchemaMap.set(
    'ErrorResponse',
    registry.register('ErrorResponse', authSchemas.ErrorResponseSchema),
  );

  // Register auto-approval schemas
  registeredSchemaMap.set(
    'AutoApprovalSettings',
    registry.register('AutoApprovalSettings', autoApprovalSchemas.AutoApprovalSettingsSchema),
  );
  registeredSchemaMap.set(
    'GetSettingsResponse',
    registry.register('GetSettingsResponse', autoApprovalSchemas.GetSettingsResponseSchema),
  );
  registeredSchemaMap.set(
    'UpdateSettingsRequest',
    registry.register('UpdateSettingsRequest', autoApprovalSchemas.UpdateSettingsRequestSchema),
  );
  registeredSchemaMap.set(
    'UpdateSettingsResponse',
    registry.register('UpdateSettingsResponse', autoApprovalSchemas.UpdateSettingsResponseSchema),
  );
  registeredSchemaMap.set(
    'GetDashboardQuery',
    registry.register('GetDashboardQuery', autoApprovalSchemas.GetDashboardQuerySchema),
  );
  registeredSchemaMap.set(
    'GetDashboardResponse',
    registry.register('GetDashboardResponse', autoApprovalSchemas.GetDashboardResponseSchema),
  );
  registeredSchemaMap.set(
    'Dashboard',
    registry.register('Dashboard', autoApprovalSchemas.DashboardSchema),
  );
  registeredSchemaMap.set(
    'NotificationSettings',
    registry.register('NotificationSettings', autoApprovalSchemas.NotificationSettingsSchema),
  );
  registeredSchemaMap.set(
    'DateRange',
    registry.register('DateRange', autoApprovalSchemas.DateRangeSchema),
  );
  registeredSchemaMap.set(
    'DashboardStatistics',
    registry.register('DashboardStatistics', autoApprovalSchemas.DashboardStatisticsSchema),
  );
  registeredSchemaMap.set(
    'RiskDistribution',
    registry.register('RiskDistribution', autoApprovalSchemas.RiskDistributionSchema),
  );
  registeredSchemaMap.set(
    'RejectionReasons',
    registry.register('RejectionReasons', autoApprovalSchemas.RejectionReasonsSchema),
  );
  registeredSchemaMap.set(
    'DailyTrend',
    registry.register('DailyTrend', autoApprovalSchemas.DailyTrendSchema),
  );
  registeredSchemaMap.set(
    'RecentActivity',
    registry.register('RecentActivity', autoApprovalSchemas.RecentActivitySchema),
  );

  // Register campaign schemas
  registeredSchemaMap.set(
    'CampaignAcceptStatus',
    registry.register('CampaignAcceptStatus', campaignSchemas.CampaignAcceptStatusSchema),
  );
  registeredSchemaMap.set(
    'CampaignPeriodType',
    registry.register('CampaignPeriodType', campaignSchemas.CampaignPeriodTypeSchema),
  );
  registeredSchemaMap.set(
    'CampaignListItem',
    registry.register('CampaignListItem', campaignSchemas.CampaignListItemSchema),
  );
  registeredSchemaMap.set(
    'CampaignDetailPeriod',
    registry.register('CampaignDetailPeriod', campaignSchemas.CampaignDetailPeriodSchema),
  );
  registeredSchemaMap.set(
    'CampaignDetailDiscount',
    registry.register('CampaignDetailDiscount', campaignSchemas.CampaignDetailDiscountSchema),
  );
  registeredSchemaMap.set(
    'CampaignDetailAutoGrant',
    registry.register('CampaignDetailAutoGrant', campaignSchemas.CampaignDetailAutoGrantSchema),
  );
  registeredSchemaMap.set(
    'CampaignDetailStats',
    registry.register('CampaignDetailStats', campaignSchemas.CampaignDetailStatsSchema),
  );
  registeredSchemaMap.set(
    'CampaignDetailMetadata',
    registry.register('CampaignDetailMetadata', campaignSchemas.CampaignDetailMetadataSchema),
  );
  registeredSchemaMap.set(
    'CampaignDetail',
    registry.register('CampaignDetail', campaignSchemas.CampaignDetailSchema),
  );
  registeredSchemaMap.set(
    'FranchiseCompanyType',
    registry.register('FranchiseCompanyType', franchiseCompanySchemas.FranchiseCompanyTypeSchema),
  );
  registeredSchemaMap.set(
    'FranchiseCompanyStatus',
    registry.register(
      'FranchiseCompanyStatus',
      franchiseCompanySchemas.FranchiseCompanyStatusSchema,
    ),
  );
  registeredSchemaMap.set(
    'FranchiseCompanyListItem',
    registry.register(
      'FranchiseCompanyListItem',
      franchiseCompanySchemas.FranchiseCompanyListItemSchema,
    ),
  );
  registeredSchemaMap.set(
    'FranchiseCompanyLinkedStore',
    registry.register(
      'FranchiseCompanyLinkedStore',
      franchiseCompanySchemas.FranchiseCompanyLinkedStoreSchema,
    ),
  );
  registeredSchemaMap.set(
    'FranchiseCompanyHistoryItem',
    registry.register(
      'FranchiseCompanyHistoryItem',
      franchiseCompanySchemas.FranchiseCompanyHistoryItemSchema,
    ),
  );
  registeredSchemaMap.set(
    'GetFranchiseCompaniesQuery',
    registry.register(
      'GetFranchiseCompaniesQuery',
      franchiseCompanySchemas.GetFranchiseCompaniesQuerySchema,
    ),
  );
  registeredSchemaMap.set(
    'GetFranchiseCompaniesResponse',
    registry.register(
      'GetFranchiseCompaniesResponse',
      franchiseCompanySchemas.GetFranchiseCompaniesResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'GetFranchiseCompanyDetailResponse',
    registry.register(
      'GetFranchiseCompanyDetailResponse',
      franchiseCompanySchemas.GetFranchiseCompanyDetailResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'UpdateFranchiseCompanyBody',
    registry.register(
      'UpdateFranchiseCompanyBody',
      franchiseCompanySchemas.UpdateFranchiseCompanyBodySchema,
    ),
  );
  registeredSchemaMap.set(
    'UpdateFranchiseCompanyResponse',
    registry.register(
      'UpdateFranchiseCompanyResponse',
      franchiseCompanySchemas.UpdateFranchiseCompanyResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'DeleteFranchiseCompanyResponse',
    registry.register(
      'DeleteFranchiseCompanyResponse',
      franchiseCompanySchemas.DeleteFranchiseCompanyResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'GetFranchiseCompanyHistoryResponse',
    registry.register(
      'GetFranchiseCompanyHistoryResponse',
      franchiseCompanySchemas.GetFranchiseCompanyHistoryResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'GetCampaignsQuery',
    registry.register('GetCampaignsQuery', campaignSchemas.GetCampaignsQuerySchema),
  );
  registeredSchemaMap.set(
    'GetCampaignsResponse',
    registry.register('GetCampaignsResponse', campaignSchemas.GetCampaignsResponseSchema),
  );
  registeredSchemaMap.set(
    'GetCampaignDetailResponse',
    registry.register('GetCampaignDetailResponse', campaignSchemas.GetCampaignDetailResponseSchema),
  );

  // Register promo code schemas
  registeredSchemaMap.set(
    'PromoCodeStatus',
    registry.register('PromoCodeStatus', promoCodeSchemas.PromoCodeStatusSchema),
  );
  registeredSchemaMap.set(
    'PromoCodeUsageCapMode',
    registry.register('PromoCodeUsageCapMode', promoCodeSchemas.PromoCodeUsageCapModeSchema),
  );
  registeredSchemaMap.set(
    'PromoCodeStoreScope',
    registry.register('PromoCodeStoreScope', promoCodeSchemas.PromoCodeStoreScopeSchema),
  );
  registeredSchemaMap.set(
    'GetPromoCodesQuery',
    registry.register('GetPromoCodesQuery', promoCodeSchemas.GetPromoCodesQuerySchema),
  );
  registeredSchemaMap.set(
    'PromoCodeUpsertBody',
    registry.register('PromoCodeUpsertBody', promoCodeSchemas.PromoCodeUpsertBodySchema),
  );
  registeredSchemaMap.set(
    'UpdatePromoCodeStatusBody',
    registry.register(
      'UpdatePromoCodeStatusBody',
      promoCodeSchemas.UpdatePromoCodeStatusBodySchema,
    ),
  );
  registeredSchemaMap.set(
    'PromoCodeRecord',
    registry.register('PromoCodeRecord', promoCodeSchemas.PromoCodeRecordSchema),
  );
  registeredSchemaMap.set(
    'GetPromoCodesResponse',
    registry.register('GetPromoCodesResponse', promoCodeSchemas.GetPromoCodesResponseSchema),
  );
  registeredSchemaMap.set(
    'CreatePromoCodeResponse',
    registry.register('CreatePromoCodeResponse', promoCodeSchemas.CreatePromoCodeResponseSchema),
  );
  registeredSchemaMap.set(
    'UpdatePromoCodeResponse',
    registry.register('UpdatePromoCodeResponse', promoCodeSchemas.UpdatePromoCodeResponseSchema),
  );
  registeredSchemaMap.set(
    'PromoCodeErrorResponse',
    registry.register('PromoCodeErrorResponse', promoCodeSchemas.PromoCodeErrorResponseSchema),
  );
  // Register locker schemas
  registeredSchemaMap.set(
    'LockerShape',
    registry.register('LockerShape', lockerSchemas.LockerShapeSchema),
  );
  registeredSchemaMap.set(
    'LockerNumberingPattern',
    registry.register('LockerNumberingPattern', lockerSchemas.LockerNumberingPatternSchema),
  );
  registeredSchemaMap.set(
    'LockerOptionType',
    registry.register('LockerOptionType', lockerSchemas.LockerOptionTypeSchema),
  );
  registeredSchemaMap.set(
    'LockerContractStatus',
    registry.register('LockerContractStatus', lockerSchemas.LockerContractStatusSchema),
  );
  registeredSchemaMap.set(
    'LockerPendingLocation',
    registry.register('LockerPendingLocation', lockerSchemas.LockerPendingLocationSchema),
  );
  registeredSchemaMap.set(
    'LockerLockType',
    registry.register('LockerLockType', lockerSchemas.LockerLockTypeSchema),
  );
  registeredSchemaMap.set(
    'LockerSlotStatus',
    registry.register('LockerSlotStatus', lockerSchemas.LockerSlotStatusSchema),
  );
  registeredSchemaMap.set(
    'LockerSlotOpenType',
    registry.register('LockerSlotOpenType', lockerSchemas.LockerSlotOpenTypeSchema),
  );
  registeredSchemaMap.set(
    'LockerReminderNotificationStatus',
    registry.register(
      'LockerReminderNotificationStatus',
      lockerSchemas.LockerReminderNotificationStatusSchema,
    ),
  );
  registeredSchemaMap.set(
    'LockerReminderNotificationMethod',
    registry.register(
      'LockerReminderNotificationMethod',
      lockerSchemas.LockerReminderNotificationMethodSchema,
    ),
  );
  registeredSchemaMap.set(
    'LockerSortField',
    registry.register('LockerSortField', lockerSchemas.LockerSortFieldSchema),
  );
  registeredSchemaMap.set(
    'LockerContractSortField',
    registry.register('LockerContractSortField', lockerSchemas.LockerContractSortFieldSchema),
  );
  registeredSchemaMap.set(
    'LockerPendingSortField',
    registry.register('LockerPendingSortField', lockerSchemas.LockerPendingSortFieldSchema),
  );
  registeredSchemaMap.set(
    'LockerListItem',
    registry.register('LockerListItem', lockerSchemas.LockerListItemSchema),
  );
  registeredSchemaMap.set(
    'LockerContractListItem',
    registry.register('LockerContractListItem', lockerSchemas.LockerContractListItemSchema),
  );
  registeredSchemaMap.set(
    'LockerPendingSlotListItem',
    registry.register('LockerPendingSlotListItem', lockerSchemas.LockerPendingSlotListItemSchema),
  );
  registeredSchemaMap.set(
    'LockerPagination',
    registry.register('LockerPagination', lockerSchemas.LockerPaginationSchema),
  );
  registeredSchemaMap.set(
    'GetLockersQuery',
    registry.register('GetLockersQuery', lockerSchemas.GetLockersQuerySchema),
  );
  registeredSchemaMap.set(
    'GetLockerContractsQuery',
    registry.register('GetLockerContractsQuery', lockerSchemas.GetLockerContractsQuerySchema),
  );
  registeredSchemaMap.set(
    'GetLockerPendingSlotsQuery',
    registry.register('GetLockerPendingSlotsQuery', lockerSchemas.GetLockerPendingSlotsQuerySchema),
  );
  registeredSchemaMap.set(
    'GetLockersResponse',
    registry.register('GetLockersResponse', lockerSchemas.GetLockersResponseSchema),
  );
  registeredSchemaMap.set(
    'GetLockerContractsResponse',
    registry.register('GetLockerContractsResponse', lockerSchemas.GetLockerContractsResponseSchema),
  );
  registeredSchemaMap.set(
    'GetLockerPendingSlotsResponse',
    registry.register(
      'GetLockerPendingSlotsResponse',
      lockerSchemas.GetLockerPendingSlotsResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'GetLockerSummaryResponse',
    registry.register('GetLockerSummaryResponse', lockerSchemas.GetLockerSummaryResponseSchema),
  );
  registeredSchemaMap.set(
    'LockerOptionMasterRef',
    registry.register('LockerOptionMasterRef', lockerSchemas.LockerOptionMasterRefSchema),
  );
  registeredSchemaMap.set(
    'LockerContractTypeMaster',
    registry.register('LockerContractTypeMaster', lockerSchemas.LockerContractTypeMasterSchema),
  );
  registeredSchemaMap.set(
    'LockerReminderNotification',
    registry.register('LockerReminderNotification', lockerSchemas.LockerReminderNotificationSchema),
  );
  registeredSchemaMap.set(
    'LockerSlotItem',
    registry.register('LockerSlotItem', lockerSchemas.LockerSlotItemSchema),
  );
  registeredSchemaMap.set(
    'LockerSlotSummary',
    registry.register('LockerSlotSummary', lockerSchemas.LockerSlotSummarySchema),
  );
  registeredSchemaMap.set(
    'LockerDetail',
    registry.register('LockerDetail', lockerSchemas.LockerDetailSchema),
  );
  registeredSchemaMap.set(
    'GetLockerDetailResponse',
    registry.register('GetLockerDetailResponse', lockerSchemas.GetLockerDetailResponseSchema),
  );
  registeredSchemaMap.set(
    'GetLockerHistoryQuery',
    registry.register('GetLockerHistoryQuery', lockerSchemas.GetLockerHistoryQuerySchema),
  );
  registeredSchemaMap.set(
    'LockerHistoryItem',
    registry.register('LockerHistoryItem', lockerSchemas.LockerHistoryItemSchema),
  );
  registeredSchemaMap.set(
    'LockerHistoryPagination',
    registry.register('LockerHistoryPagination', lockerSchemas.LockerHistoryPaginationSchema),
  );
  registeredSchemaMap.set(
    'GetLockerHistoryResponse',
    registry.register('GetLockerHistoryResponse', lockerSchemas.GetLockerHistoryResponseSchema),
  );
  registeredSchemaMap.set(
    'DeleteLockerResponse',
    registry.register('DeleteLockerResponse', lockerSchemas.DeleteLockerResponseSchema),
  );
  registeredSchemaMap.set(
    'BulkReleaseLockerSlotsItem',
    registry.register('BulkReleaseLockerSlotsItem', lockerSchemas.BulkReleaseLockerSlotsItemSchema),
  );
  registeredSchemaMap.set(
    'BulkReleaseLockerSlotsRequest',
    registry.register(
      'BulkReleaseLockerSlotsRequest',
      lockerSchemas.BulkReleaseLockerSlotsRequestSchema,
    ),
  );
  registeredSchemaMap.set(
    'BulkReleaseLockerSlotsResponse',
    registry.register(
      'BulkReleaseLockerSlotsResponse',
      lockerSchemas.BulkReleaseLockerSlotsResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'UpdateLockerSlotRequest',
    registry.register('UpdateLockerSlotRequest', lockerSchemas.UpdateLockerSlotRequestSchema),
  );
  registeredSchemaMap.set(
    'UpdateLockerSlotResponse',
    registry.register('UpdateLockerSlotResponse', lockerSchemas.UpdateLockerSlotResponseSchema),
  );
  registeredSchemaMap.set(
    'SendLockerSlotReminderRequest',
    registry.register(
      'SendLockerSlotReminderRequest',
      lockerSchemas.SendLockerSlotReminderRequestSchema,
    ),
  );
  registeredSchemaMap.set(
    'SendLockerSlotReminderResponse',
    registry.register(
      'SendLockerSlotReminderResponse',
      lockerSchemas.SendLockerSlotReminderResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'LockerErrorResponse',
    registry.register('LockerErrorResponse', lockerSchemas.ErrorResponseSchema),
  );
  registeredSchemaMap.set(
    'ExportLockersQuery',
    registry.register('ExportLockersQuery', lockerSchemas.ExportLockersQuerySchema),
  );
  registeredSchemaMap.set(
    'ExportLockerContractsQuery',
    registry.register('ExportLockerContractsQuery', lockerSchemas.ExportLockerContractsQuerySchema),
  );
  registeredSchemaMap.set(
    'ExportLockerPendingSlotsQuery',
    registry.register(
      'ExportLockerPendingSlotsQuery',
      lockerSchemas.ExportLockerPendingSlotsQuerySchema,
    ),
  );
  registeredSchemaMap.set(
    'ExportLockerSlotsQuery',
    registry.register('ExportLockerSlotsQuery', lockerSchemas.ExportLockerSlotsQuerySchema),
  );
  registeredSchemaMap.set(
    'ExportLockersRequest',
    registry.register('ExportLockersRequest', lockerSchemas.ExportLockersRequestSchema),
  );
  registeredSchemaMap.set(
    'ExportLockerContractsRequest',
    registry.register(
      'ExportLockerContractsRequest',
      lockerSchemas.ExportLockerContractsRequestSchema,
    ),
  );
  registeredSchemaMap.set(
    'ExportLockerPendingSlotsRequest',
    registry.register(
      'ExportLockerPendingSlotsRequest',
      lockerSchemas.ExportLockerPendingSlotsRequestSchema,
    ),
  );
  registeredSchemaMap.set(
    'ExportLockerSlotsRequest',
    registry.register('ExportLockerSlotsRequest', lockerSchemas.ExportLockerSlotsRequestSchema),
  );
  registeredSchemaMap.set(
    'ExportLockersResponse',
    registry.register('ExportLockersResponse', lockerSchemas.ExportLockersResponseSchema),
  );
  registeredSchemaMap.set(
    'ExportLockerContractsResponse',
    registry.register(
      'ExportLockerContractsResponse',
      lockerSchemas.ExportLockerContractsResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'ExportLockerPendingSlotsResponse',
    registry.register(
      'ExportLockerPendingSlotsResponse',
      lockerSchemas.ExportLockerPendingSlotsResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'ExportLockerSlotsResponse',
    registry.register('ExportLockerSlotsResponse', lockerSchemas.ExportLockerSlotsResponseSchema),
  );

  // Register member schemas
  registeredSchemaMap.set(
    'MemberListItem',
    registry.register('MemberListItem', memberSchemas.MemberListItemSchema),
  );
  registeredSchemaMap.set(
    'MemberType',
    registry.register('MemberType', memberSchemas.MemberTypeSchema),
  );
  registeredSchemaMap.set(
    'ContractType',
    registry.register('ContractType', memberSchemas.ContractTypeSchema),
  );
  registeredSchemaMap.set(
    'MemberStatus',
    registry.register('MemberStatus', memberSchemas.MemberStatusSchema),
  );
  registeredSchemaMap.set('Brand', registry.register('Brand', memberSchemas.BrandSchema));
  registeredSchemaMap.set(
    'MainBrand',
    registry.register('MainBrand', memberSchemas.MainBrandSchema),
  );
  registeredSchemaMap.set('Gender', registry.register('Gender', memberSchemas.GenderSchema));
  registeredSchemaMap.set('MemoType', registry.register('MemoType', memberSchemas.MemoTypeSchema));
  registeredSchemaMap.set(
    'PointAdjustmentType',
    registry.register('PointAdjustmentType', memberSchemas.PointAdjustmentTypeSchema),
  );
  registeredSchemaMap.set(
    'Pagination',
    registry.register('Pagination', memberSchemas.PaginationSchema),
  );
  registeredSchemaMap.set(
    'GetMembersQuery',
    registry.register('GetMembersQuery', memberSchemas.GetMembersQuerySchema),
  );
  registeredSchemaMap.set(
    'GetMembersResponse',
    registry.register('GetMembersResponse', memberSchemas.GetMembersResponseSchema),
  );
  registeredSchemaMap.set(
    'GetMembersSummaryResponse',
    registry.register('GetMembersSummaryResponse', memberSchemas.GetMembersSummaryResponseSchema),
  );
  registeredSchemaMap.set(
    'GetMemberDetailResponse',
    registry.register('GetMemberDetailResponse', memberSchemas.GetMemberDetailResponseSchema),
  );
  registeredSchemaMap.set(
    'GetMemberMainContractLabelsResponse',
    registry.register(
      'GetMemberMainContractLabelsResponse',
      memberSchemas.GetMemberMainContractLabelsResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'UpdateBasicInfoRequest',
    registry.register('UpdateBasicInfoRequest', memberSchemas.UpdateBasicInfoRequestSchema),
  );
  registeredSchemaMap.set(
    'UpdateBasicInfoResponse',
    registry.register('UpdateBasicInfoResponse', memberSchemas.UpdateBasicInfoResponseSchema),
  );
  registeredSchemaMap.set(
    'UpdateHealthInfoRequest',
    registry.register('UpdateHealthInfoRequest', memberSchemas.UpdateHealthInfoRequestSchema),
  );
  registeredSchemaMap.set(
    'UpdateHealthInfoResponse',
    registry.register('UpdateHealthInfoResponse', memberSchemas.UpdateHealthInfoResponseSchema),
  );
  registeredSchemaMap.set(
    'UpdateMarketingConsentRequest',
    registry.register(
      'UpdateMarketingConsentRequest',
      memberSchemas.UpdateMarketingConsentRequestSchema,
    ),
  );
  registeredSchemaMap.set(
    'UpdateMarketingConsentResponse',
    registry.register(
      'UpdateMarketingConsentResponse',
      memberSchemas.UpdateMarketingConsentResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'PointAdjustmentRequest',
    registry.register('PointAdjustmentRequest', memberSchemas.PointAdjustmentRequestSchema),
  );
  registeredSchemaMap.set(
    'PointAdjustmentResponse',
    registry.register('PointAdjustmentResponse', memberSchemas.PointAdjustmentResponseSchema),
  );
  registeredSchemaMap.set(
    'GetPointsResponse',
    registry.register('GetPointsResponse', memberSchemas.GetPointsResponseSchema),
  );
  registeredSchemaMap.set(
    'CreateMemoRequest',
    registry.register('CreateMemoRequest', memberSchemas.CreateMemoRequestSchema),
  );
  registeredSchemaMap.set(
    'StaffMemo',
    registry.register('StaffMemo', memberSchemas.StaffMemoSchema),
  );
  registeredSchemaMap.set(
    'CreateMemoResponse',
    registry.register('CreateMemoResponse', memberSchemas.CreateMemoResponseSchema),
  );
  registeredSchemaMap.set(
    'UpdateMemoRequest',
    registry.register('UpdateMemoRequest', memberSchemas.UpdateMemoRequestSchema),
  );
  registeredSchemaMap.set(
    'UpdateMemoResponse',
    registry.register('UpdateMemoResponse', memberSchemas.UpdateMemoResponseSchema),
  );
  registeredSchemaMap.set(
    'GetMemosResponse',
    registry.register('GetMemosResponse', memberSchemas.GetMemosResponseSchema),
  );
  registeredSchemaMap.set(
    'ExportMembersRequest',
    registry.register('ExportMembersRequest', memberSchemas.ExportMembersRequestSchema),
  );
  registeredSchemaMap.set(
    'ExportMembersStatus',
    registry.register('ExportMembersStatus', memberSchemas.ExportMembersStatusSchema),
  );
  registeredSchemaMap.set(
    'ExportMembersResponse',
    registry.register('ExportMembersResponse', memberSchemas.ExportMembersResponseSchema),
  );
  registeredSchemaMap.set(
    'ContractChange',
    registry.register('ContractChange', memberSchemas.ContractChangeSchema),
  );
  registeredSchemaMap.set(
    'MainContract',
    registry.register('MainContract', memberSchemas.MainContractSchema),
  );
  registeredSchemaMap.set(
    'OptionContract',
    registry.register('OptionContract', memberSchemas.OptionContractSchema),
  );
  registeredSchemaMap.set(
    'OptionChangeHistory',
    registry.register('OptionChangeHistory', memberSchemas.OptionChangeHistorySchema),
  );
  registeredSchemaMap.set(
    'SpecialContractItem',
    registry.register('SpecialContractItem', memberSchemas.SpecialContractItemSchema),
  );
  registeredSchemaMap.set(
    'SpecialContracts',
    registry.register('SpecialContracts', memberSchemas.SpecialContractsSchema),
  );
  registeredSchemaMap.set(
    'PaymentRecord',
    registry.register('PaymentRecord', memberSchemas.PaymentRecordSchema),
  );
  registeredSchemaMap.set(
    'PaymentInfo',
    registry.register('PaymentInfo', memberSchemas.PaymentInfoSchema),
  );
  registeredSchemaMap.set(
    'UnpaidInfo',
    registry.register('UnpaidInfo', memberSchemas.UnpaidInfoSchema),
  );
  registeredSchemaMap.set('Campaign', registry.register('Campaign', memberSchemas.CampaignSchema));
  registeredSchemaMap.set(
    'Campaigns',
    registry.register('Campaigns', memberSchemas.CampaignsSchema),
  );
  registeredSchemaMap.set(
    'CampaignStatus',
    registry.register('CampaignStatus', memberSchemas.CampaignStatusSchema),
  );
  registeredSchemaMap.set(
    'GetContractsResponse',
    registry.register('GetContractsResponse', memberSchemas.GetContractsResponseSchema),
  );
  registeredSchemaMap.set(
    'TrainingRecordsPeriod',
    registry.register('TrainingRecordsPeriod', memberSchemas.TrainingRecordsPeriodSchema),
  );
  registeredSchemaMap.set(
    'GetTrainingRecordsPathParams',
    registry.register(
      'GetTrainingRecordsPathParams',
      memberSchemas.GetTrainingRecordsPathParamsSchema,
    ),
  );
  registeredSchemaMap.set(
    'GetTrainingRecordsQuery',
    registry.register('GetTrainingRecordsQuery', memberSchemas.GetTrainingRecordsQuerySchema),
  );
  registeredSchemaMap.set(
    'TrainingRecordItem',
    registry.register('TrainingRecordItem', memberSchemas.TrainingRecordItemSchema),
  );
  registeredSchemaMap.set(
    'TrainingRecordSummary',
    registry.register('TrainingRecordSummary', memberSchemas.TrainingRecordSummarySchema),
  );
  registeredSchemaMap.set(
    'GetTrainingRecordsResponse',
    registry.register('GetTrainingRecordsResponse', memberSchemas.GetTrainingRecordsResponseSchema),
  );
  registeredSchemaMap.set(
    'BodyDataSource',
    registry.register('BodyDataSource', memberSchemas.BodyDataSourceSchema),
  );
  registeredSchemaMap.set(
    'GetBodyDataPathParams',
    registry.register('GetBodyDataPathParams', memberSchemas.GetBodyDataPathParamsSchema),
  );
  registeredSchemaMap.set(
    'BodyDataLatestSummary',
    registry.register('BodyDataLatestSummary', memberSchemas.BodyDataLatestSummarySchema),
  );
  registeredSchemaMap.set(
    'BodyComposition',
    registry.register('BodyComposition', memberSchemas.BodyCompositionSchema),
  );
  registeredSchemaMap.set(
    'BodyMeasurement',
    registry.register('BodyMeasurement', memberSchemas.BodyMeasurementSchema),
  );
  registeredSchemaMap.set(
    'BodyDataHistoryItem',
    registry.register('BodyDataHistoryItem', memberSchemas.BodyDataHistoryItemSchema),
  );
  registeredSchemaMap.set(
    'BodyWeightChartItem',
    registry.register('BodyWeightChartItem', memberSchemas.BodyWeightChartItemSchema),
  );
  registeredSchemaMap.set(
    'GetBodyDataResponse',
    registry.register('GetBodyDataResponse', memberSchemas.GetBodyDataResponseSchema),
  );

  // Register membership application schemas
  registeredSchemaMap.set(
    'MembershipApplication',
    registry.register(
      'MembershipApplication',
      membershipApplicationSchemas.MembershipApplicationSchema,
    ),
  );
  registeredSchemaMap.set(
    'MembershipApplicationPaymentMethod',
    registry.register(
      'MembershipApplicationPaymentMethod',
      membershipApplicationSchemas.MembershipApplicationPaymentMethodSchema,
    ),
  );
  registeredSchemaMap.set(
    'MembershipApplicationPaymentStatus',
    registry.register(
      'MembershipApplicationPaymentStatus',
      membershipApplicationSchemas.MembershipApplicationPaymentStatusSchema,
    ),
  );
  registeredSchemaMap.set(
    'MembershipApplicationStatus',
    registry.register(
      'MembershipApplicationStatus',
      membershipApplicationSchemas.MembershipApplicationStatusSchema,
    ),
  );
  registeredSchemaMap.set(
    'RiskReason',
    registry.register('RiskReason', membershipApplicationSchemas.RiskReasonSchema),
  );
  registeredSchemaMap.set(
    'GetMembershipApplicationsQuery',
    registry.register(
      'GetMembershipApplicationsQuery',
      membershipApplicationSchemas.GetMembershipApplicationsQuerySchema,
    ),
  );
  registeredSchemaMap.set(
    'GetMembershipApplicationsResponse',
    registry.register(
      'GetMembershipApplicationsResponse',
      membershipApplicationSchemas.GetMembershipApplicationsResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'GetApplicationDetailResponse',
    registry.register(
      'GetApplicationDetailResponse',
      membershipApplicationSchemas.GetApplicationDetailResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'UpdateMembershipApplicationRequest',
    registry.register(
      'UpdateMembershipApplicationRequest',
      membershipApplicationSchemas.UpdateMembershipApplicationRequestSchema,
    ),
  );
  registeredSchemaMap.set(
    'UpdateMembershipApplicationResponse',
    registry.register(
      'UpdateMembershipApplicationResponse',
      membershipApplicationSchemas.UpdateMembershipApplicationResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'ApproveRequest',
    registry.register('ApproveRequest', membershipApplicationSchemas.ApproveRequestSchema),
  );
  registeredSchemaMap.set(
    'ApproveResponse',
    registry.register('ApproveResponse', membershipApplicationSchemas.ApproveResponseSchema),
  );
  registeredSchemaMap.set(
    'RejectRequest',
    registry.register('RejectRequest', membershipApplicationSchemas.RejectRequestSchema),
  );
  registeredSchemaMap.set(
    'RejectResponse',
    registry.register('RejectResponse', membershipApplicationSchemas.RejectResponseSchema),
  );
  registeredSchemaMap.set(
    'CancelRequest',
    registry.register('CancelRequest', membershipApplicationSchemas.CancelRequestSchema),
  );
  registeredSchemaMap.set(
    'CancelResponse',
    registry.register('CancelResponse', membershipApplicationSchemas.CancelResponseSchema),
  );

  // Register family registration schemas
  registeredSchemaMap.set(
    'FamilyMember',
    registry.register('FamilyMember', familyRegistrationSchemas.FamilyMemberSchema),
  );
  registeredSchemaMap.set(
    'PrimaryMemberStatus',
    registry.register('PrimaryMemberStatus', familyRegistrationSchemas.PrimaryMemberStatusSchema),
  );
  registeredSchemaMap.set(
    'PrimaryMemberType',
    registry.register('PrimaryMemberType', familyRegistrationSchemas.PrimaryMemberTypeSchema),
  );
  registeredSchemaMap.set(
    'FamilyRegistrationRiskReason',
    registry.register(
      'FamilyRegistrationRiskReason',
      familyRegistrationSchemas.FamilyRegistrationRiskReasonSchema,
    ),
  );
  registeredSchemaMap.set(
    'GetFamilyMembersResponse',
    registry.register(
      'GetFamilyMembersResponse',
      familyRegistrationSchemas.GetFamilyMembersResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'CheckPrimaryMemberRequest',
    registry.register(
      'CheckPrimaryMemberRequest',
      familyRegistrationSchemas.CheckPrimaryMemberRequestSchema,
    ),
  );
  registeredSchemaMap.set(
    'CheckPrimaryMemberResponse',
    registry.register(
      'CheckPrimaryMemberResponse',
      familyRegistrationSchemas.CheckPrimaryMemberResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'RiskEvaluationRequest',
    registry.register(
      'RiskEvaluationRequest',
      familyRegistrationSchemas.RiskEvaluationRequestSchema,
    ),
  );
  registeredSchemaMap.set(
    'RiskEvaluationResponse',
    registry.register(
      'RiskEvaluationResponse',
      familyRegistrationSchemas.RiskEvaluationResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'FamilyRegistration',
    registry.register('FamilyRegistration', familyRegistrationSchemas.FamilyRegistrationSchema),
  );
  registeredSchemaMap.set(
    'GetFamilyRegistrationsQuery',
    registry.register(
      'GetFamilyRegistrationsQuery',
      familyRegistrationSchemas.GetFamilyRegistrationsQuerySchema,
    ),
  );
  registeredSchemaMap.set(
    'GetFamilyRegistrationsResponse',
    registry.register(
      'GetFamilyRegistrationsResponse',
      familyRegistrationSchemas.GetFamilyRegistrationsResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'GetFamilyRegistrationDetailResponse',
    registry.register(
      'GetFamilyRegistrationDetailResponse',
      familyRegistrationSchemas.GetFamilyRegistrationDetailResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'CreateFamilyRegistrationRequest',
    registry.register(
      'CreateFamilyRegistrationRequest',
      familyRegistrationSchemas.CreateFamilyRegistrationRequestSchema,
    ),
  );
  registeredSchemaMap.set(
    'CreateFamilyRegistrationResponse',
    registry.register(
      'CreateFamilyRegistrationResponse',
      familyRegistrationSchemas.CreateFamilyRegistrationResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'ApproveFamilyRegistrationRequest',
    registry.register(
      'ApproveFamilyRegistrationRequest',
      familyRegistrationSchemas.ApproveFamilyRegistrationRequestSchema,
    ),
  );
  registeredSchemaMap.set(
    'ApproveFamilyRegistrationResponse',
    registry.register(
      'ApproveFamilyRegistrationResponse',
      familyRegistrationSchemas.ApproveFamilyRegistrationResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'RejectFamilyRegistrationRequest',
    registry.register(
      'RejectFamilyRegistrationRequest',
      familyRegistrationSchemas.RejectFamilyRegistrationRequestSchema,
    ),
  );
  registeredSchemaMap.set(
    'RejectFamilyRegistrationResponse',
    registry.register(
      'RejectFamilyRegistrationResponse',
      familyRegistrationSchemas.RejectFamilyRegistrationResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'CompleteFamilyRegistrationRequest',
    registry.register(
      'CompleteFamilyRegistrationRequest',
      familyRegistrationSchemas.CompleteFamilyRegistrationRequestSchema,
    ),
  );
  registeredSchemaMap.set(
    'CompleteFamilyRegistrationResponse',
    registry.register(
      'CompleteFamilyRegistrationResponse',
      familyRegistrationSchemas.CompleteFamilyRegistrationResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'GetFamilyRegistrationsSummaryResponse',
    registry.register(
      'GetFamilyRegistrationsSummaryResponse',
      familyRegistrationSchemas.GetFamilyRegistrationsSummaryResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'GetFamilyRegistrationsDashboardResponse',
    registry.register(
      'GetFamilyRegistrationsDashboardResponse',
      familyRegistrationSchemas.GetFamilyRegistrationsDashboardResponseSchema,
    ),
  );

  // Register position / store masters
  registeredSchemaMap.set(
    'PositionRoleCategory',
    registry.register('PositionRoleCategory', positionSchemas.PositionRoleCategorySchema),
  );
  registeredSchemaMap.set(
    'PositionFeatures',
    registry.register('PositionFeatures', positionSchemas.PositionFeaturesSchema),
  );
  registeredSchemaMap.set(
    'Position',
    registry.register('Position', positionSchemas.PositionSchema),
  );
  registeredSchemaMap.set(
    'StaffPermissionRecord',
    registry.register('StaffPermissionRecord', positionSchemas.StaffPermissionRecordSchema),
  );
  registeredSchemaMap.set(
    'GetPositionsResponse',
    registry.register('GetPositionsResponse', positionSchemas.GetPositionsResponseSchema),
  );
  registeredSchemaMap.set(
    'MainContractType',
    registry.register('MainContractType', mainContractSchemas.MainContractTypeSchema),
  );
  registeredSchemaMap.set(
    'MainContractStatus',
    registry.register('MainContractStatus', mainContractSchemas.MainContractStatusSchema),
  );
  registeredSchemaMap.set(
    'MainContractOtherStoreUsage',
    registry.register(
      'MainContractOtherStoreUsage',
      mainContractSchemas.MainContractOtherStoreUsageSchema,
    ),
  );
  registeredSchemaMap.set(
    'MainContractListItem',
    registry.register('MainContractListItem', mainContractSchemas.MainContractListItemSchema),
  );
  registeredSchemaMap.set(
    'GetMainContractsQuery',
    registry.register('GetMainContractsQuery', mainContractSchemas.GetMainContractsQuerySchema),
  );
  registeredSchemaMap.set(
    'GetMainContractsResponse',
    registry.register(
      'GetMainContractsResponse',
      mainContractSchemas.GetMainContractsResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'StoreMainContractStatus',
    registry.register('StoreMainContractStatus', storeSchemas.StoreMainContractStatusSchema),
  );
  registeredSchemaMap.set(
    'MutualUseType',
    registry.register('MutualUseType', storeSchemas.MutualUseTypeSchema),
  );
  registeredSchemaMap.set(
    'StoreListBrand',
    registry.register('StoreListBrand', storeSchemas.StoreListBrandSchema),
  );
  registeredSchemaMap.set(
    'StoreArea',
    registry.register('StoreArea', storeSchemas.StoreAreaSchema),
  );
  registeredSchemaMap.set(
    'StoreListStatus',
    registry.register('StoreListStatus', storeSchemas.StoreListStatusSchema),
  );
  registeredSchemaMap.set('Store', registry.register('Store', storeSchemas.StoreSchema));
  registeredSchemaMap.set(
    'GetStoresQuery',
    registry.register('GetStoresQuery', storeSchemas.GetStoresQuerySchema),
  );
  registeredSchemaMap.set(
    'GetStoresResponse',
    registry.register('GetStoresResponse', storeSchemas.GetStoresResponseSchema),
  );
  registeredSchemaMap.set(
    'PermittedStore',
    registry.register('PermittedStore', storeAccessSettingsSchemas.PermittedStoreSchema),
  );
  registeredSchemaMap.set(
    'JoyUsageFee',
    registry.register('JoyUsageFee', storeAccessSettingsSchemas.JoyUsageFeeSchema),
  );
  registeredSchemaMap.set(
    'StoreAccessSettings',
    registry.register('StoreAccessSettings', storeAccessSettingsSchemas.StoreAccessSettingsSchema),
  );
  registeredSchemaMap.set(
    'GetStoreAccessSettingsResponse',
    registry.register(
      'GetStoreAccessSettingsResponse',
      storeAccessSettingsSchemas.GetStoreAccessSettingsResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'UpdateStoreAccessSettingsRequest',
    registry.register(
      'UpdateStoreAccessSettingsRequest',
      storeAccessSettingsSchemas.UpdateStoreAccessSettingsRequestSchema,
    ),
  );
  registeredSchemaMap.set(
    'UpdateStoreAccessSettingsResponse',
    registry.register(
      'UpdateStoreAccessSettingsResponse',
      storeAccessSettingsSchemas.UpdateStoreAccessSettingsResponseSchema,
    ),
  );

  // Register business hours schemas
  registeredSchemaMap.set(
    'DayOfWeek',
    registry.register('DayOfWeek', storeSchemas.DayOfWeekSchema),
  );
  registeredSchemaMap.set(
    'DefaultHoursEntry',
    registry.register('DefaultHoursEntry', storeSchemas.DefaultHoursEntrySchema),
  );
  registeredSchemaMap.set(
    'ExceptionHoursEntry',
    registry.register('ExceptionHoursEntry', storeSchemas.ExceptionHoursEntrySchema),
  );
  registeredSchemaMap.set(
    'TemporaryClosureEntry',
    registry.register('TemporaryClosureEntry', storeSchemas.TemporaryClosureEntrySchema),
  );
  registeredSchemaMap.set(
    'StoreBusinessHours',
    registry.register('StoreBusinessHours', storeSchemas.StoreBusinessHoursSchema),
  );
  registeredSchemaMap.set(
    'UpdateStoreBusinessHoursPayload',
    registry.register(
      'UpdateStoreBusinessHoursPayload',
      storeSchemas.UpdateStoreBusinessHoursPayloadSchema,
    ),
  );
  registeredSchemaMap.set(
    'GetStoreBusinessHoursResponse',
    registry.register(
      'GetStoreBusinessHoursResponse',
      storeSchemas.GetStoreBusinessHoursResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'UpdateStoreBusinessHoursResponse',
    registry.register(
      'UpdateStoreBusinessHoursResponse',
      storeSchemas.UpdateStoreBusinessHoursResponseSchema,
    ),
  );

  // Register staff enum schemas
  registeredSchemaMap.set(
    'StaffRole',
    registry.register('StaffRole', staffSchemas.StaffRoleSchema),
  );
  registeredSchemaMap.set(
    'StaffLinkageType',
    registry.register('StaffLinkageType', staffSchemas.StaffLinkageTypeSchema),
  );
  registeredSchemaMap.set(
    'StaffLinkage',
    registry.register('StaffLinkage', staffSchemas.StaffLinkageSchema),
  );
  registeredSchemaMap.set(
    'StaffStatus',
    registry.register('StaffStatus', staffSchemas.StaffStatusSchema),
  );
  registeredSchemaMap.set(
    'StaffBrand',
    registry.register('StaffBrand', staffSchemas.StaffBrandSchema),
  );
  registeredSchemaMap.set(
    'ManagedBrandCode',
    registry.register('ManagedBrandCode', brandSchemas.ManagedBrandCodeSchema),
  );
  registeredSchemaMap.set(
    'BrandIdInput',
    registry.register('BrandIdInput', brandSchemas.BrandIdInputSchema),
  );
  registeredSchemaMap.set(
    'BrandPagination',
    registry.register('BrandPagination', brandSchemas.BrandPaginationSchema),
  );
  registeredSchemaMap.set(
    'BrandStatus',
    registry.register('BrandStatus', brandSchemas.BrandStatusSchema),
  );
  registeredSchemaMap.set(
    'BrandListItem',
    registry.register('BrandListItem', brandSchemas.BrandListItemSchema),
  );
  registeredSchemaMap.set(
    'BrandDetail',
    registry.register('BrandDetail', brandSchemas.BrandDetailSchema),
  );
  registeredSchemaMap.set(
    'BrandScheduledFeeChange',
    registry.register('BrandScheduledFeeChange', brandSchemas.BrandScheduledFeeChangeSchema),
  );
  registeredSchemaMap.set(
    'BrandFeeItem',
    registry.register('BrandFeeItem', brandSchemas.BrandFeeItemSchema),
  );
  registeredSchemaMap.set(
    'UpdateBrandFeeItem',
    registry.register('UpdateBrandFeeItem', brandSchemas.UpdateBrandFeeItemSchema),
  );
  registeredSchemaMap.set(
    'BrandFeeGroup',
    registry.register('BrandFeeGroup', brandSchemas.BrandFeeGroupSchema),
  );
  registeredSchemaMap.set(
    'BrandChangeHistoryItem',
    registry.register('BrandChangeHistoryItem', brandSchemas.BrandChangeHistoryItemSchema),
  );
  registeredSchemaMap.set(
    'GetBrandDetailResponse',
    registry.register('GetBrandDetailResponse', brandSchemas.GetBrandDetailResponseSchema),
  );
  registeredSchemaMap.set(
    'GetBrandFeesResponse',
    registry.register('GetBrandFeesResponse', brandSchemas.GetBrandFeesResponseSchema),
  );
  registeredSchemaMap.set(
    'GetBrandChangeHistoryResponse',
    registry.register(
      'GetBrandChangeHistoryResponse',
      brandSchemas.GetBrandChangeHistoryResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'UpdateBrandFeeGroupRequest',
    registry.register('UpdateBrandFeeGroupRequest', brandSchemas.UpdateBrandFeeGroupRequestSchema),
  );
  registeredSchemaMap.set(
    'UpdateBrandFeeGroupResponse',
    registry.register(
      'UpdateBrandFeeGroupResponse',
      brandSchemas.UpdateBrandFeeGroupResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'DisableBrandFeeGroupResponse',
    registry.register(
      'DisableBrandFeeGroupResponse',
      brandSchemas.DisableBrandFeeGroupResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'DeleteBrandFeeGroupResponse',
    registry.register(
      'DeleteBrandFeeGroupResponse',
      brandSchemas.DeleteBrandFeeGroupResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'GetBrandsQuery',
    registry.register('GetBrandsQuery', brandSchemas.GetBrandsQuerySchema),
  );
  registeredSchemaMap.set(
    'GetBrandsResponse',
    registry.register('GetBrandsResponse', brandSchemas.GetBrandsResponseSchema),
  );
  registeredSchemaMap.set(
    'CreateBrandRequest',
    registry.register('CreateBrandRequest', brandSchemas.CreateBrandRequestSchema),
  );
  registeredSchemaMap.set(
    'CreateBrandResponse',
    registry.register('CreateBrandResponse', brandSchemas.CreateBrandResponseSchema),
  );
  registeredSchemaMap.set(
    'UpdateBrandRequest',
    registry.register('UpdateBrandRequest', brandSchemas.UpdateBrandRequestSchema),
  );
  registeredSchemaMap.set(
    'UpdateBrandResponse',
    registry.register('UpdateBrandResponse', brandSchemas.UpdateBrandResponseSchema),
  );

  // Register staff schemas
  registeredSchemaMap.set(
    'StaffListItem',
    registry.register('StaffListItem', staffSchemas.StaffListItemSchema),
  );
  registeredSchemaMap.set(
    'StaffPersonalInfo',
    registry.register('StaffPersonalInfo', staffSchemas.StaffPersonalInfoSchema),
  );
  registeredSchemaMap.set(
    'StaffLoginSettings',
    registry.register('StaffLoginSettings', staffSchemas.StaffLoginSettingsSchema),
  );
  registeredSchemaMap.set(
    'StaffAdditionalPermissions',
    registry.register('StaffAdditionalPermissions', staffSchemas.StaffAdditionalPermissionsSchema),
  );
  registeredSchemaMap.set(
    'StaffPermissionSettings',
    registry.register('StaffPermissionSettings', staffSchemas.StaffPermissionSettingsSchema),
  );
  registeredSchemaMap.set(
    'StaffEditableScope',
    registry.register('StaffEditableScope', staffSchemas.StaffEditableScopeSchema),
  );
  registeredSchemaMap.set(
    'StaffDetail',
    registry.register('StaffDetail', staffSchemas.StaffDetailSchema),
  );
  registeredSchemaMap.set(
    'GetStaffsQuery',
    registry.register('GetStaffsQuery', staffSchemas.GetStaffsQuerySchema),
  );
  registeredSchemaMap.set(
    'GetStaffsResponse',
    registry.register('GetStaffsResponse', staffSchemas.GetStaffsResponseSchema),
  );
  registeredSchemaMap.set(
    'GetStaffDetailResponse',
    registry.register('GetStaffDetailResponse', staffSchemas.GetStaffDetailResponseSchema),
  );
  registeredSchemaMap.set(
    'UpdateStaffRequest',
    registry.register('UpdateStaffRequest', staffSchemas.UpdateStaffRequestSchema),
  );
  registeredSchemaMap.set(
    'UpdateStaffResponse',
    registry.register('UpdateStaffResponse', staffSchemas.UpdateStaffResponseSchema),
  );
  registeredSchemaMap.set(
    'InviteStaffRequest',
    registry.register('InviteStaffRequest', staffSchemas.InviteStaffRequestSchema),
  );
  registeredSchemaMap.set(
    'InviteStaffResponse',
    registry.register('InviteStaffResponse', staffSchemas.InviteStaffResponseSchema),
  );
  registeredSchemaMap.set(
    'DeleteStaffResponse',
    registry.register('DeleteStaffResponse', staffSchemas.DeleteStaffResponseSchema),
  );

  // Register leave schemas
  registeredSchemaMap.set(
    'LeaveType',
    registry.register('LeaveType', leaveSchemas.LeaveTypeSchema),
  );
  registeredSchemaMap.set(
    'LeaveStatus',
    registry.register('LeaveStatus', leaveSchemas.LeaveStatusSchema),
  );
  registeredSchemaMap.set(
    'LeaveListItem',
    registry.register('LeaveListItem', leaveSchemas.LeaveListItemSchema),
  );
  registeredSchemaMap.set(
    'GetLeavesQuery',
    registry.register('GetLeavesQuery', leaveSchemas.GetLeavesQuerySchema),
  );
  registeredSchemaMap.set(
    'GetLeavesResponse',
    registry.register('GetLeavesResponse', leaveSchemas.GetLeavesResponseSchema),
  );
  registeredSchemaMap.set(
    'LeaveErrorResponse',
    registry.register('LeaveErrorResponse', leaveSchemas.ErrorResponseSchema),
  );

  // Register blacklist schemas
  registeredSchemaMap.set(
    'BlacklistRegistrationSource',
    registry.register(
      'BlacklistRegistrationSource',
      blacklistSchemas.BlacklistRegistrationSourceSchema,
    ),
  );
  registeredSchemaMap.set(
    'BlacklistManualReason',
    registry.register('BlacklistManualReason', blacklistSchemas.BlacklistManualReasonSchema),
  );
  registeredSchemaMap.set(
    'UnpaidFilter',
    registry.register('UnpaidFilter', blacklistSchemas.UnpaidFilterSchema),
  );

  // Register withdraw schemas
  registeredSchemaMap.set(
    'WithdrawReason',
    registry.register('WithdrawReason', memberSchemas.WithdrawReasonSchema),
  );

  // Register gate stop schemas
  registeredSchemaMap.set(
    'GateStopInfo',
    registry.register('GateStopInfo', memberSchemas.GateStopInfoSchema),
  );
  registeredSchemaMap.set(
    'GateStopReason',
    registry.register('GateStopReason', memberSchemas.GateStopReasonSchema),
  );
  registeredSchemaMap.set(
    'GateStopScope',
    registry.register('GateStopScope', memberSchemas.GateStopScopeSchema),
  );
  registeredSchemaMap.set(
    'GateStopRequest',
    registry.register('GateStopRequest', memberSchemas.GateStopRequestSchema),
  );
  registeredSchemaMap.set(
    'GateStopResponse',
    registry.register('GateStopResponse', memberSchemas.GateStopResponseSchema),
  );
  registeredSchemaMap.set(
    'GateStopReleaseReason',
    registry.register('GateStopReleaseReason', memberSchemas.GateStopReleaseReasonSchema),
  );
  registeredSchemaMap.set(
    'GateStopReleaseRequest',
    registry.register('GateStopReleaseRequest', memberSchemas.GateStopReleaseRequestSchema),
  );
  registeredSchemaMap.set(
    'GateStopReleaseResponse',
    registry.register('GateStopReleaseResponse', memberSchemas.GateStopReleaseResponseSchema),
  );

  // Register option master schemas
  registeredSchemaMap.set(
    'OptionDiscountType',
    registry.register('OptionDiscountType', optionDiscountSchemas.OptionDiscountTypeSchema),
  );
  registeredSchemaMap.set(
    'OptionDiscountStatus',
    registry.register('OptionDiscountStatus', optionDiscountSchemas.OptionDiscountStatusSchema),
  );
  registeredSchemaMap.set(
    'OptionDiscountCondition',
    registry.register(
      'OptionDiscountCondition',
      optionDiscountSchemas.OptionDiscountConditionSchema,
    ),
  );
  registeredSchemaMap.set(
    'OptionDiscountListItem',
    registry.register('OptionDiscountListItem', optionDiscountSchemas.OptionDiscountListItemSchema),
  );
  registeredSchemaMap.set(
    'GetOptionDiscountsQuery',
    registry.register(
      'GetOptionDiscountsQuery',
      optionDiscountSchemas.GetOptionDiscountsQuerySchema,
    ),
  );
  registeredSchemaMap.set(
    'GetOptionDiscountsResponse',
    registry.register(
      'GetOptionDiscountsResponse',
      optionDiscountSchemas.GetOptionDiscountsResponseSchema,
    ),
  );

  // Register option master schemas
  registeredSchemaMap.set(
    'OptionType',
    registry.register('OptionType', optionMasterSchemas.OptionTypeSchema),
  );
  registeredSchemaMap.set(
    'OptionStatus',
    registry.register('OptionStatus', optionMasterSchemas.OptionStatusSchema),
  );
  registeredSchemaMap.set(
    'OptionProrataMethod',
    registry.register('OptionProrataMethod', optionMasterSchemas.OptionProrataMethodSchema),
  );
  registeredSchemaMap.set(
    'OptionUsageRule',
    registry.register('OptionUsageRule', optionMasterSchemas.OptionUsageRuleSchema),
  );
  registeredSchemaMap.set(
    'OptionMasterListItem',
    registry.register('OptionMasterListItem', optionMasterSchemas.OptionMasterListItemSchema),
  );
  registeredSchemaMap.set(
    'GetOptionMastersQuery',
    registry.register('GetOptionMastersQuery', optionMasterSchemas.GetOptionMastersQuerySchema),
  );
  registeredSchemaMap.set(
    'GetOptionMastersResponse',
    registry.register(
      'GetOptionMastersResponse',
      optionMasterSchemas.GetOptionMastersResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'OptionCategory',
    registry.register('OptionCategory', optionMasterSchemas.OptionCategorySchema),
  );
  registeredSchemaMap.set(
    'OptionMasterCategory',
    registry.register('OptionMasterCategory', optionMasterSchemas.OptionMasterCategorySchema),
  );
  registeredSchemaMap.set(
    'OptionMasterDetail',
    registry.register('OptionMasterDetail', optionMasterSchemas.OptionMasterDetailSchema),
  );
  registeredSchemaMap.set(
    'GetOptionMasterDetailResponse',
    registry.register(
      'GetOptionMasterDetailResponse',
      optionMasterSchemas.GetOptionMasterDetailResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'UpsertOptionMasterBody',
    registry.register('UpsertOptionMasterBody', optionMasterSchemas.UpsertOptionMasterBodySchema),
  );
  registeredSchemaMap.set(
    'CreateOptionMasterResponse',
    registry.register(
      'CreateOptionMasterResponse',
      optionMasterSchemas.CreateOptionMasterResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'UpdateOptionMasterResponse',
    registry.register(
      'UpdateOptionMasterResponse',
      optionMasterSchemas.UpdateOptionMasterResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'OptionMasterChangeHistoryItem',
    registry.register(
      'OptionMasterChangeHistoryItem',
      optionMasterSchemas.OptionMasterChangeHistoryItemSchema,
    ),
  );
  registeredSchemaMap.set(
    'GetOptionMasterChangeHistoryResponse',
    registry.register(
      'GetOptionMasterChangeHistoryResponse',
      optionMasterSchemas.GetOptionMasterChangeHistoryResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'DeleteOptionMasterRequest',
    registry.register(
      'DeleteOptionMasterRequest',
      optionMasterSchemas.DeleteOptionMasterRequestSchema,
    ),
  );
  registeredSchemaMap.set(
    'DeleteOptionMasterResponse',
    registry.register(
      'DeleteOptionMasterResponse',
      optionMasterSchemas.DeleteOptionMasterResponseSchema,
    ),
  );

  registeredSchemaMap.set(
    'VisitExperienceStatus',
    registry.register('VisitExperienceStatus', visitExperienceSchemas.VisitExperienceStatusSchema),
  );
  registeredSchemaMap.set(
    'VisitExperience',
    registry.register('VisitExperience', visitExperienceSchemas.VisitExperienceSchema),
  );
  registeredSchemaMap.set(
    'GetVisitExperiencesQuery',
    registry.register(
      'GetVisitExperiencesQuery',
      visitExperienceSchemas.GetVisitExperiencesQuerySchema,
    ),
  );
  registeredSchemaMap.set(
    'GetVisitExperiencesResponse',
    registry.register(
      'GetVisitExperiencesResponse',
      visitExperienceSchemas.GetVisitExperiencesResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'GetVisitExperiencesSummaryResponse',
    registry.register(
      'GetVisitExperiencesSummaryResponse',
      visitExperienceSchemas.GetVisitExperiencesSummaryResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'VisitTimelineEntry',
    registry.register('VisitTimelineEntry', visitExperienceSchemas.VisitTimelineEntrySchema),
  );
  registeredSchemaMap.set(
    'VisitExperienceDetail',
    registry.register('VisitExperienceDetail', visitExperienceSchemas.VisitExperienceDetailSchema),
  );
  registeredSchemaMap.set(
    'PermitVisitExperienceResponse',
    registry.register(
      'PermitVisitExperienceResponse',
      visitExperienceSchemas.PermitVisitExperienceResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'PermitVisitExperienceError',
    registry.register(
      'PermitVisitExperienceError',
      visitExperienceSchemas.PermitVisitExperienceErrorSchema,
    ),
  );
  // D-01: Lesson Schedules

  // Register survey schemas
  registeredSchemaMap.set(
    'SurveyTemplateType',
    registry.register('SurveyTemplateType', surveySchemas.SurveyTemplateTypeSchema),
  );
  registeredSchemaMap.set(
    'SurveyTemplateTrigger',
    registry.register('SurveyTemplateTrigger', surveySchemas.SurveyTemplateTriggerSchema),
  );
  registeredSchemaMap.set(
    'SurveyTemplateStatus',
    registry.register('SurveyTemplateStatus', surveySchemas.SurveyTemplateStatusSchema),
  );
  registeredSchemaMap.set(
    'SurveyQuestionFormat',
    registry.register('SurveyQuestionFormat', surveySchemas.SurveyQuestionFormatSchema),
  );
  registeredSchemaMap.set(
    'SurveyQuestionChoice',
    registry.register('SurveyQuestionChoice', surveySchemas.SurveyQuestionChoiceSchema),
  );
  registeredSchemaMap.set(
    'SurveyQuestion',
    registry.register('SurveyQuestion', surveySchemas.SurveyQuestionSchema),
  );
  registeredSchemaMap.set(
    'SurveyTemplateListItem',
    registry.register('SurveyTemplateListItem', surveySchemas.SurveyTemplateListItemSchema),
  );
  registeredSchemaMap.set(
    'GetSurveyTemplatesQuery',
    registry.register('GetSurveyTemplatesQuery', surveySchemas.GetSurveyTemplatesQuerySchema),
  );
  registeredSchemaMap.set(
    'GetSurveyTemplatesResponse',
    registry.register('GetSurveyTemplatesResponse', surveySchemas.GetSurveyTemplatesResponseSchema),
  );
  registeredSchemaMap.set(
    'SurveyTemplateDetail',
    registry.register('SurveyTemplateDetail', surveySchemas.SurveyTemplateDetailSchema),
  );
  registeredSchemaMap.set(
    'SurveyTemplateUpsertQuestion',
    registry.register(
      'SurveyTemplateUpsertQuestion',
      surveySchemas.SurveyTemplateUpsertQuestionSchema,
    ),
  );
  registeredSchemaMap.set(
    'SurveyTemplateUpsertBody',
    registry.register('SurveyTemplateUpsertBody', surveySchemas.SurveyTemplateUpsertBodySchema),
  );
  registeredSchemaMap.set(
    'SurveyTemplateUpsertResponse',
    registry.register(
      'SurveyTemplateUpsertResponse',
      surveySchemas.SurveyTemplateUpsertResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'GetSurveyTemplateDetailResponse',
    registry.register(
      'GetSurveyTemplateDetailResponse',
      surveySchemas.GetSurveyTemplateDetailResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'UpdateSurveyTemplateStatusBody',
    registry.register(
      'UpdateSurveyTemplateStatusBody',
      surveySchemas.UpdateSurveyTemplateStatusBodySchema,
    ),
  );
  registeredSchemaMap.set(
    'UpdateSurveyTemplateStatusResponse',
    registry.register(
      'UpdateSurveyTemplateStatusResponse',
      surveySchemas.UpdateSurveyTemplateStatusResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'DeleteSurveyTemplateResponse',
    registry.register(
      'DeleteSurveyTemplateResponse',
      surveySchemas.DeleteSurveyTemplateResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'SurveyTemplateChangeHistoryItem',
    registry.register(
      'SurveyTemplateChangeHistoryItem',
      surveySchemas.SurveyTemplateChangeHistoryItemSchema,
    ),
  );

  // D-01: Lesson Schedules

  registeredSchemaMap.set(
    'LessonType',
    registry.register('LessonType', lessonScheduleSchemas.LessonTypeSchema),
  );
  registeredSchemaMap.set(
    'LessonScheduleStatus',
    registry.register('LessonScheduleStatus', lessonScheduleSchemas.LessonScheduleStatusSchema),
  );
  registeredSchemaMap.set(
    'PaymentStatus',
    registry.register('PaymentStatus', lessonScheduleSchemas.PaymentStatusSchema),
  );
  registeredSchemaMap.set(
    'ScheduleAxis',
    registry.register('ScheduleAxis', lessonScheduleSchemas.ScheduleAxisSchema),
  );
  registeredSchemaMap.set(
    'ScheduleViewMode',
    registry.register('ScheduleViewMode', lessonScheduleSchemas.ScheduleViewModeSchema),
  );
  registeredSchemaMap.set(
    'ScheduleSortBy',
    registry.register('ScheduleSortBy', lessonScheduleSchemas.ScheduleSortBySchema),
  );
  registeredSchemaMap.set(
    'BookedMember',
    registry.register('BookedMember', lessonScheduleSchemas.BookedMemberSchema),
  );
  registeredSchemaMap.set(
    'LessonScheduleListItem',
    registry.register('LessonScheduleListItem', lessonScheduleSchemas.LessonScheduleListItemSchema),
  );
  registeredSchemaMap.set(
    'LessonScheduleKpiSummary',
    registry.register(
      'LessonScheduleKpiSummary',
      lessonScheduleSchemas.LessonScheduleKpiSummarySchema,
    ),
  );
  registeredSchemaMap.set(
    'StoreScheduleSummary',
    registry.register('StoreScheduleSummary', lessonScheduleSchemas.StoreScheduleSummarySchema),
  );
  registeredSchemaMap.set(
    'AreaScheduleKpiSummary',
    registry.register('AreaScheduleKpiSummary', lessonScheduleSchemas.AreaScheduleKpiSummarySchema),
  );
  registeredSchemaMap.set(
    'ScheduleChangeDraft',
    registry.register('ScheduleChangeDraft', lessonScheduleSchemas.ScheduleChangeDraftSchema),
  );
  registeredSchemaMap.set(
    'GetLessonSchedulesQuery',
    registry.register(
      'GetLessonSchedulesQuery',
      lessonScheduleSchemas.GetLessonSchedulesQuerySchema,
    ),
  );
  registeredSchemaMap.set(
    'GetStoreSummaryQuery',
    registry.register('GetStoreSummaryQuery', lessonScheduleSchemas.GetStoreSummaryQuerySchema),
  );
  registeredSchemaMap.set(
    'GetLessonSchedulesResponse',
    registry.register(
      'GetLessonSchedulesResponse',
      lessonScheduleSchemas.GetLessonSchedulesResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'GetLessonScheduleKpiSummaryResponse',
    registry.register(
      'GetLessonScheduleKpiSummaryResponse',
      lessonScheduleSchemas.GetLessonScheduleKpiSummaryResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'GetStoreSummaryResponse',
    registry.register(
      'GetStoreSummaryResponse',
      lessonScheduleSchemas.GetStoreSummaryResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'ScheduleChangeResponse',
    registry.register('ScheduleChangeResponse', lessonScheduleSchemas.ScheduleChangeResponseSchema),
  );

  // D-01 FR-007: Lesson Reservations
  registeredSchemaMap.set(
    'ReservationStatus',
    registry.register('ReservationStatus', lessonReservationSchemas.ReservationStatusSchema),
  );
  registeredSchemaMap.set(
    'AttendanceStatus',
    registry.register('AttendanceStatus', lessonReservationSchemas.AttendanceStatusSchema),
  );
  registeredSchemaMap.set(
    'CancelType',
    registry.register('CancelType', lessonReservationSchemas.CancelTypeSchema),
  );
  registeredSchemaMap.set(
    'Reservation',
    registry.register('Reservation', lessonReservationSchemas.ReservationSchema),
  );
  registeredSchemaMap.set(
    'ReservationListResponse',
    registry.register(
      'ReservationListResponse',
      lessonReservationSchemas.ReservationListResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'ReservationsQuery',
    registry.register('ReservationsQuery', lessonReservationSchemas.ReservationsQuerySchema),
  );
  registeredSchemaMap.set(
    'AddReservationRequest',
    registry.register(
      'AddReservationRequest',
      lessonReservationSchemas.AddReservationRequestSchema,
    ),
  );
  registeredSchemaMap.set(
    'CancelReservationRequest',
    registry.register(
      'CancelReservationRequest',
      lessonReservationSchemas.CancelReservationRequestSchema,
    ),
  );
  registeredSchemaMap.set(
    'CancelReservationResponse',
    registry.register(
      'CancelReservationResponse',
      lessonReservationSchemas.CancelReservationResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'UpdateAttendanceRequest',
    registry.register(
      'UpdateAttendanceRequest',
      lessonReservationSchemas.UpdateAttendanceRequestSchema,
    ),
  );
  registeredSchemaMap.set(
    'StudioSpaceType',
    registry.register('StudioSpaceType', lessonReservationSchemas.StudioSpaceTypeSchema),
  );
  registeredSchemaMap.set(
    'StudioSpace',
    registry.register('StudioSpace', lessonReservationSchemas.StudioSpaceSchema),
  );
  registeredSchemaMap.set(
    'StudioSpaceGridResponse',
    registry.register(
      'StudioSpaceGridResponse',
      lessonReservationSchemas.StudioSpaceGridResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'ReservationStats',
    registry.register('ReservationStats', lessonReservationSchemas.ReservationStatsSchema),
  );
  registeredSchemaMap.set(
    'ReservationStatsResponse',
    registry.register(
      'ReservationStatsResponse',
      lessonReservationSchemas.ReservationStatsResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'MemberSearchResult',
    registry.register('MemberSearchResult', lessonReservationSchemas.MemberSearchResultSchema),
  );
  registeredSchemaMap.set(
    'MemberSearchResponse',
    registry.register('MemberSearchResponse', lessonReservationSchemas.MemberSearchResponseSchema),
  );
  registeredSchemaMap.set(
    'MemberSearchQuery',
    registry.register('MemberSearchQuery', lessonReservationSchemas.MemberSearchQuerySchema),
  );
  registeredSchemaMap.set(
    'ChangeInstructorRequest',
    registry.register(
      'ChangeInstructorRequest',
      lessonReservationSchemas.ChangeInstructorRequestSchema,
    ),
  );
  registeredSchemaMap.set(
    'ChangeTimeRequest',
    registry.register('ChangeTimeRequest', lessonReservationSchemas.ChangeTimeRequestSchema),
  );
  registeredSchemaMap.set(
    'ChangeStudioRequest',
    registry.register('ChangeStudioRequest', lessonReservationSchemas.ChangeStudioRequestSchema),
  );
  registeredSchemaMap.set(
    'ChangeResponse',
    registry.register('ChangeResponse', lessonReservationSchemas.ChangeResponseSchema),
  );
  registeredSchemaMap.set(
    'CancelLessonRequest',
    registry.register('CancelLessonRequest', lessonReservationSchemas.CancelLessonRequestSchema),
  );
  registeredSchemaMap.set(
    'CancelLessonResponse',
    registry.register('CancelLessonResponse', lessonReservationSchemas.CancelLessonResponseSchema),
  );
  registeredSchemaMap.set(
    'SessionMemo',
    registry.register('SessionMemo', lessonReservationSchemas.SessionMemoSchema),
  );
  registeredSchemaMap.set(
    'CreateMemoRequest',
    registry.register('CreateMemoRequest', lessonReservationSchemas.CreateMemoRequestSchema),
  );
  registeredSchemaMap.set(
    'MemoListResponse',
    registry.register('MemoListResponse', lessonReservationSchemas.MemoListResponseSchema),
  );

  // D-02: Lesson Content Master (list/search)
  registeredSchemaMap.set(
    'LessonBrand',
    registry.register('LessonBrand', lessonContentSchemas.LessonBrandSchema),
  );
  registeredSchemaMap.set(
    'LessonContentStatus',
    registry.register('LessonContentStatus', lessonContentSchemas.LessonContentStatusSchema),
  );
  registeredSchemaMap.set(
    'LessonPricingType',
    registry.register('LessonPricingType', lessonContentSchemas.LessonPricingTypeSchema),
  );
  registeredSchemaMap.set(
    'LessonGenderRestriction',
    registry.register(
      'LessonGenderRestriction',
      lessonContentSchemas.LessonGenderRestrictionSchema,
    ),
  );
  registeredSchemaMap.set(
    'LessonKind',
    registry.register('LessonKind', lessonContentSchemas.LessonKindSchema),
  );
  registeredSchemaMap.set(
    'LessonContentItem',
    registry.register('LessonContentItem', lessonContentSchemas.LessonContentItemSchema),
  );
  registeredSchemaMap.set(
    'PersonalPlanItem',
    registry.register('PersonalPlanItem', lessonContentSchemas.PersonalPlanItemSchema),
  );
  registeredSchemaMap.set(
    'LessonPagination',
    registry.register('LessonPagination', lessonContentSchemas.LessonPaginationSchema),
  );
  registeredSchemaMap.set(
    'GetLessonContentsQuery',
    registry.register('GetLessonContentsQuery', lessonContentSchemas.GetLessonContentsQuerySchema),
  );
  registeredSchemaMap.set(
    'GetLessonContentsResponse',
    registry.register(
      'GetLessonContentsResponse',
      lessonContentSchemas.GetLessonContentsResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'GetPersonalPlansQuery',
    registry.register('GetPersonalPlansQuery', lessonContentSchemas.GetPersonalPlansQuerySchema),
  );
  registeredSchemaMap.set(
    'GetPersonalPlansResponse',
    registry.register(
      'GetPersonalPlansResponse',
      lessonContentSchemas.GetPersonalPlansResponseSchema,
    ),
  );

  // Register equipment schemas
  registeredSchemaMap.set(
    'EquipmentStatus',
    registry.register('EquipmentStatus', equipmentSchemas.EquipmentStatusSchema),
  );
  registeredSchemaMap.set(
    'EquipmentType',
    registry.register('EquipmentType', equipmentSchemas.EquipmentTypeSchema),
  );
  registeredSchemaMap.set(
    'EquipmentAuthenticationMethod',
    registry.register(
      'EquipmentAuthenticationMethod',
      equipmentSchemas.EquipmentAuthenticationMethodSchema,
    ),
  );
  registeredSchemaMap.set(
    'ConnectedEquipmentListItem',
    registry.register(
      'ConnectedEquipmentListItem',
      equipmentSchemas.ConnectedEquipmentListItemSchema,
    ),
  );
  registeredSchemaMap.set(
    'GetEquipmentQuery',
    registry.register('GetEquipmentQuery', equipmentSchemas.GetEquipmentQuerySchema),
  );
  registeredSchemaMap.set(
    'GetEquipmentResponse',
    registry.register('GetEquipmentResponse', equipmentSchemas.GetEquipmentResponseSchema),
  );
  registeredSchemaMap.set(
    'GetEquipmentSummaryResponse',
    registry.register(
      'GetEquipmentSummaryResponse',
      equipmentSchemas.GetEquipmentSummaryResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'ExportEquipmentRequest',
    registry.register('ExportEquipmentRequest', equipmentSchemas.ExportEquipmentRequestSchema),
  );
  registeredSchemaMap.set(
    'BulkUpdateEquipmentStatusRequest',
    registry.register(
      'BulkUpdateEquipmentStatusRequest',
      equipmentSchemas.BulkUpdateEquipmentStatusRequestSchema,
    ),
  );
  registeredSchemaMap.set(
    'BulkUpdateEquipmentStatusResult',
    registry.register(
      'BulkUpdateEquipmentStatusResult',
      equipmentSchemas.BulkUpdateEquipmentStatusResultSchema,
    ),
  );
  registeredSchemaMap.set(
    'BulkUpdateEquipmentStatusResponse',
    registry.register(
      'BulkUpdateEquipmentStatusResponse',
      equipmentSchemas.BulkUpdateEquipmentStatusResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'UsageControlRuleDisplay',
    registry.register('UsageControlRuleDisplay', equipmentSchemas.UsageControlRuleDisplaySchema),
  );
  registeredSchemaMap.set(
    'ControllerSummary',
    registry.register('ControllerSummary', equipmentSchemas.ControllerSummarySchema),
  );
  registeredSchemaMap.set(
    'ConnectedEquipmentDetail',
    registry.register('ConnectedEquipmentDetail', equipmentSchemas.ConnectedEquipmentDetailSchema),
  );
  registeredSchemaMap.set(
    'EquipmentStatusHistoryItem',
    registry.register(
      'EquipmentStatusHistoryItem',
      equipmentSchemas.EquipmentStatusHistoryItemSchema,
    ),
  );
  registeredSchemaMap.set(
    'GetEquipmentDetailResponse',
    registry.register(
      'GetEquipmentDetailResponse',
      equipmentSchemas.GetEquipmentDetailResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'GetEquipmentHistoryResponse',
    registry.register(
      'GetEquipmentHistoryResponse',
      equipmentSchemas.GetEquipmentHistoryResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'EquipmentUsageControlRuleInput',
    registry.register(
      'EquipmentUsageControlRuleInput',
      equipmentSchemas.EquipmentUsageControlRuleInputSchema,
    ),
  );
  registeredSchemaMap.set(
    'UpsertEquipmentRequest',
    registry.register('UpsertEquipmentRequest', equipmentSchemas.UpsertEquipmentRequestSchema),
  );
  registeredSchemaMap.set(
    'PatchEquipmentRequest',
    registry.register('PatchEquipmentRequest', equipmentSchemas.PatchEquipmentRequestSchema),
  );
  registeredSchemaMap.set(
    'CreateEquipmentResponse',
    registry.register('CreateEquipmentResponse', equipmentSchemas.CreateEquipmentResponseSchema),
  );
  registeredSchemaMap.set(
    'UpdateEquipmentResponse',
    registry.register('UpdateEquipmentResponse', equipmentSchemas.UpdateEquipmentResponseSchema),
  );

  // Register training equipment schemas
  registeredSchemaMap.set(
    'TrainingEquipmentStatus',
    registry.register(
      'TrainingEquipmentStatus',
      trainingEquipmentSchemas.TrainingEquipmentStatusSchema,
    ),
  );
  registeredSchemaMap.set(
    'TrainingEquipmentToolType',
    registry.register(
      'TrainingEquipmentToolType',
      trainingEquipmentSchemas.TrainingEquipmentToolTypeSchema,
    ),
  );
  registeredSchemaMap.set(
    'ToolTypeCode',
    registry.register('ToolTypeCode', trainingEquipmentSchemas.ToolTypeCodeSchema),
  );
  registeredSchemaMap.set(
    'ToolType',
    registry.register('ToolType', trainingEquipmentSchemas.ToolTypeSchema),
  );
  registeredSchemaMap.set(
    'ListToolTypesQuery',
    registry.register('ListToolTypesQuery', trainingEquipmentSchemas.ListToolTypesQuerySchema),
  );
  registeredSchemaMap.set(
    'ListToolTypesResponse',
    registry.register(
      'ListToolTypesResponse',
      trainingEquipmentSchemas.ListToolTypesResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'TrainingEquipmentItem',
    registry.register(
      'TrainingEquipmentItem',
      trainingEquipmentSchemas.TrainingEquipmentItemSchema,
    ),
  );
  registeredSchemaMap.set(
    'GetTrainingEquipmentQuery',
    registry.register(
      'GetTrainingEquipmentQuery',
      trainingEquipmentSchemas.GetTrainingEquipmentQuerySchema,
    ),
  );
  registeredSchemaMap.set(
    'GetTrainingEquipmentResponse',
    registry.register(
      'GetTrainingEquipmentResponse',
      trainingEquipmentSchemas.GetTrainingEquipmentResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'UpsertTrainingEquipment',
    registry.register(
      'UpsertTrainingEquipment',
      trainingEquipmentSchemas.UpsertTrainingEquipmentSchema,
    ),
  );
  registeredSchemaMap.set(
    'PatchTrainingEquipment',
    registry.register(
      'PatchTrainingEquipment',
      trainingEquipmentSchemas.PatchTrainingEquipmentSchema,
    ),
  );
  registeredSchemaMap.set(
    'TrainingEquipmentDetailResponse',
    registry.register(
      'TrainingEquipmentDetailResponse',
      trainingEquipmentSchemas.TrainingEquipmentDetailResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'TrainingEquipmentExerciseLink',
    registry.register(
      'TrainingEquipmentExerciseLink',
      trainingEquipmentSchemas.TrainingEquipmentExerciseLinkSchema,
    ),
  );
  registeredSchemaMap.set(
    'AddTrainingEquipmentExerciseLinks',
    registry.register(
      'AddTrainingEquipmentExerciseLinks',
      trainingEquipmentSchemas.AddTrainingEquipmentExerciseLinksSchema,
    ),
  );
  registeredSchemaMap.set(
    'TrainingEquipmentExerciseLinksResponse',
    registry.register(
      'TrainingEquipmentExerciseLinksResponse',
      trainingEquipmentSchemas.TrainingEquipmentExerciseLinksResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'TrainingEquipmentStatusHistory',
    registry.register(
      'TrainingEquipmentStatusHistory',
      trainingEquipmentSchemas.TrainingEquipmentStatusHistorySchema,
    ),
  );
  registeredSchemaMap.set(
    'GetTrainingEquipmentHistoryResponse',
    registry.register(
      'GetTrainingEquipmentHistoryResponse',
      trainingEquipmentSchemas.GetTrainingEquipmentHistoryResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'UpdateTrainingEquipmentStatus',
    registry.register(
      'UpdateTrainingEquipmentStatus',
      trainingEquipmentSchemas.UpdateTrainingEquipmentStatusSchema,
    ),
  );
  registeredSchemaMap.set(
    'UpdateTrainingEquipmentStatusResponse',
    registry.register(
      'UpdateTrainingEquipmentStatusResponse',
      trainingEquipmentSchemas.UpdateTrainingEquipmentStatusResponseSchema,
    ),
  );

  // Register controller schemas
  registeredSchemaMap.set(
    'Controller',
    registry.register('Controller', controllerSchemas.ControllerSchema),
  );
  registeredSchemaMap.set(
    'ControllerListItem',
    registry.register('ControllerListItem', controllerSchemas.ControllerListItemSchema),
  );
  registeredSchemaMap.set(
    'ControllerDeviceSummary',
    registry.register('ControllerDeviceSummary', controllerSchemas.ControllerDeviceSummarySchema),
  );
  registeredSchemaMap.set(
    'ControllerDetail',
    registry.register('ControllerDetail', controllerSchemas.ControllerDetailSchema),
  );
  registeredSchemaMap.set(
    'ControllerConnectedDevice',
    registry.register(
      'ControllerConnectedDevice',
      controllerSchemas.ControllerConnectedDeviceSchema,
    ),
  );
  registeredSchemaMap.set(
    'ControllerHistoryItem',
    registry.register('ControllerHistoryItem', controllerSchemas.ControllerHistoryItemSchema),
  );
  registeredSchemaMap.set(
    'GetControllersResponse',
    registry.register('GetControllersResponse', controllerSchemas.GetControllersResponseSchema),
  );
  registeredSchemaMap.set(
    'ExportControllersRequest',
    registry.register('ExportControllersRequest', controllerSchemas.ExportControllersRequestSchema),
  );
  registeredSchemaMap.set(
    'GetControllerDevicesResponse',
    registry.register(
      'GetControllerDevicesResponse',
      controllerSchemas.GetControllerDevicesResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'GetControllerHistoryResponse',
    registry.register(
      'GetControllerHistoryResponse',
      controllerSchemas.GetControllerHistoryResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'UpsertControllerRequest',
    registry.register('UpsertControllerRequest', controllerSchemas.UpsertControllerRequestSchema),
  );
  registeredSchemaMap.set(
    'PatchControllerRequest',
    registry.register('PatchControllerRequest', controllerSchemas.PatchControllerRequestSchema),
  );
  registeredSchemaMap.set(
    'CreateControllerResponse',
    registry.register('CreateControllerResponse', controllerSchemas.CreateControllerResponseSchema),
  );
  registeredSchemaMap.set(
    'UpdateControllerResponse',
    registry.register('UpdateControllerResponse', controllerSchemas.UpdateControllerResponseSchema),
  );
  registeredSchemaMap.set(
    'GetControllerDetailResponse',
    registry.register(
      'GetControllerDetailResponse',
      controllerSchemas.GetControllerDetailResponseSchema,
    ),
  );

  // Register studio detail schemas
  registeredSchemaMap.set(
    'ReservationTier',
    registry.register('ReservationTier', studioDetailSchemas.ReservationTierSchema),
  );
  registeredSchemaMap.set(
    'LayoutState',
    registry.register('LayoutState', studioDetailSchemas.LayoutStateSchema),
  );
  registeredSchemaMap.set(
    'LayoutCellKind',
    registry.register('LayoutCellKind', studioDetailSchemas.LayoutCellKindSchema),
  );
  registeredSchemaMap.set('Trend', registry.register('Trend', studioDetailSchemas.TrendSchema));
  registeredSchemaMap.set(
    'LinkedLessonSummary',
    registry.register('LinkedLessonSummary', studioDetailSchemas.LinkedLessonSummarySchema),
  );
  registeredSchemaMap.set(
    'StudioImage',
    registry.register('StudioImage', studioDetailSchemas.StudioImageSchema),
  );
  registeredSchemaMap.set(
    'LayoutCell',
    registry.register('LayoutCell', studioDetailSchemas.LayoutCellSchema),
  );
  registeredSchemaMap.set(
    'LayoutPreview',
    registry.register('LayoutPreview', studioDetailSchemas.LayoutPreviewSchema),
  );
  registeredSchemaMap.set(
    'UtilizationSummary',
    registry.register('UtilizationSummary', studioDetailSchemas.UtilizationSummarySchema),
  );
  registeredSchemaMap.set(
    'StudioDetail',
    registry.register('StudioDetail', studioDetailSchemas.StudioDetailSchema),
  );
  registeredSchemaMap.set(
    'GetStudioDetailResponse',
    registry.register('GetStudioDetailResponse', studioDetailSchemas.GetStudioDetailResponseSchema),
  );
  registeredSchemaMap.set(
    'GetStudioDetailQuery',
    registry.register('GetStudioDetailQuery', studioDetailSchemas.GetStudioDetailQuerySchema),
  );
}
