/**
 * Register all schemas with OpenAPI registry
 * This ensures schemas are extracted to components/schemas instead of being inline
 */
import type { ZodTypeAny } from 'zod';

// Import all schemas
import * as appMaintenanceSchemas from '../_schemas/app-maintenance.schema';
import * as appVersionSchemas from '../_schemas/app-version.schema';
import * as articleCategorySchemas from '../_schemas/article-category.schema';
import * as authSchemas from '../_schemas/auth.schema';
import * as autoApprovalSchemas from '../_schemas/auto-approval.schema';
import * as bannerSchemas from '../_schemas/banner.schema';
import * as billingSchemas from '../_schemas/billing.schema';
import * as blacklistSchemas from '../_schemas/blacklist.schema';
import * as brandSchemas from '../_schemas/brand.schema';
import * as campaignSchemas from '../_schemas/campaign.schema';
import * as controllerSchemas from '../_schemas/controller.schema';
import * as crmMaintenanceSchemas from '../_schemas/crm-maintenance.schema';
import * as equipmentSchemas from '../_schemas/equipment.schema';
import * as exerciseMasterSchemas from '../_schemas/exercise-master.schema';
import * as exerciseSchemas from '../_schemas/exercise.schema';
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
import * as routineCategorySchemas from '../_schemas/routine-category.schema';
import * as routineSchemas from '../_schemas/routine.schema';
import * as staffSchemas from '../_schemas/staff.schema';
import * as storeAccessSettingsSchemas from '../_schemas/store-access-settings.schema';
import * as storeSchemas from '../_schemas/store.schema';
import * as studioDetailSchemas from '../_schemas/studio-detail.schema';
import * as surveySchemas from '../_schemas/survey.schema';
import * as termsSchemas from '../_schemas/terms.schema';
import * as trainingEquipmentSchemas from '../_schemas/training-equipment.schema';
import * as transferSchemas from '../_schemas/transfer.schema';
import * as visitExperienceSchemas from '../_schemas/visit-experience.schema';
import { registry } from './registry';

/**
 * Map to store registered schemas by their name
 * This allows routes to use the registered schemas which will generate $ref
 */
export const registeredSchemaMap = new Map<string, ZodTypeAny>();

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

  // Register app maintenance schemas
  registeredSchemaMap.set(
    'AppMaintenanceTargetBrand',
    registry.register(
      'AppMaintenanceTargetBrand',
      appMaintenanceSchemas.AppMaintenanceTargetBrandSchema,
    ),
  );
  registeredSchemaMap.set(
    'AppMaintenanceStatus',
    registry.register('AppMaintenanceStatus', appMaintenanceSchemas.AppMaintenanceStatusSchema),
  );
  registeredSchemaMap.set(
    'AppMaintenanceSortBy',
    registry.register('AppMaintenanceSortBy', appMaintenanceSchemas.AppMaintenanceSortSchema),
  );
  registeredSchemaMap.set(
    'AppMaintenance',
    registry.register('AppMaintenance', appMaintenanceSchemas.AppMaintenanceSchema),
  );
  registeredSchemaMap.set(
    'AppMaintenanceItemResponse',
    registry.register(
      'AppMaintenanceItemResponse',
      appMaintenanceSchemas.AppMaintenanceItemResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'AppMaintenanceDetailResponse',
    registry.register(
      'AppMaintenanceDetailResponse',
      appMaintenanceSchemas.AppMaintenanceDetailResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'GetAppMaintenancesQuery',
    registry.register(
      'GetAppMaintenancesQuery',
      appMaintenanceSchemas.GetAppMaintenancesQuerySchema,
    ),
  );
  registeredSchemaMap.set(
    'CreateAppMaintenanceBody',
    registry.register(
      'CreateAppMaintenanceBody',
      appMaintenanceSchemas.CreateAppMaintenanceBodySchema,
    ),
  );
  registeredSchemaMap.set(
    'UpdateAppMaintenanceBody',
    registry.register(
      'UpdateAppMaintenanceBody',
      appMaintenanceSchemas.UpdateAppMaintenanceBodySchema,
    ),
  );

  // Register terms schemas
  registeredSchemaMap.set(
    'TermsType',
    registry.register('TermsType', termsSchemas.TermsTypeSchema),
  );
  registeredSchemaMap.set(
    'TermsBrand',
    registry.register('TermsBrand', termsSchemas.TermsBrandSchema),
  );
  registeredSchemaMap.set(
    'TermsStatus',
    registry.register('TermsStatus', termsSchemas.TermsStatusSchema),
  );
  registeredSchemaMap.set('Terms', registry.register('Terms', termsSchemas.TermsSchema));
  registeredSchemaMap.set(
    'TermsListItemResponse',
    registry.register('TermsListItemResponse', termsSchemas.TermsListItemResponseSchema),
  );
  registeredSchemaMap.set(
    'TermsVersionEntry',
    registry.register('TermsVersionEntry', termsSchemas.TermsVersionEntrySchema),
  );
  registeredSchemaMap.set(
    'TermsDetailResponse',
    registry.register('TermsDetailResponse', termsSchemas.TermsDetailResponseSchema),
  );
  registeredSchemaMap.set(
    'GetTermsQuery',
    registry.register('GetTermsQuery', termsSchemas.GetTermsQuerySchema),
  );
  registeredSchemaMap.set(
    'CreateTermsBody',
    registry.register('CreateTermsBody', termsSchemas.CreateTermsBodySchema),
  );
  registeredSchemaMap.set(
    'UpdateTermsBody',
    registry.register('UpdateTermsBody', termsSchemas.UpdateTermsBodySchema),
  );
  registeredSchemaMap.set(
    'GetTermsResponse',
    registry.register('GetTermsResponse', termsSchemas.GetTermsResponseSchema),
  );
  registeredSchemaMap.set(
    'DeleteTermsResponse',
    registry.register('DeleteTermsResponse', termsSchemas.DeleteTermsResponseSchema),
  );

  // Register app version schemas
  registeredSchemaMap.set(
    'AppVersionBrandEnum',
    registry.register('AppVersionBrandEnum', appVersionSchemas.AppVersionBrandEnumSchema),
  );
  registeredSchemaMap.set(
    'AppVersionRecord',
    registry.register('AppVersionRecord', appVersionSchemas.AppVersionRecordSchema),
  );
  registeredSchemaMap.set(
    'GetAppVersionsQueryParams',
    registry.register(
      'GetAppVersionsQueryParams',
      appVersionSchemas.GetAppVersionsQueryParamsSchema,
    ),
  );
  registeredSchemaMap.set(
    'CreateAppVersionBody',
    registry.register('CreateAppVersionBody', appVersionSchemas.CreateAppVersionBodySchema),
  );
  registeredSchemaMap.set(
    'UpdateAppVersionBody',
    registry.register('UpdateAppVersionBody', appVersionSchemas.UpdateAppVersionBodySchema),
  );

  // Register CRM maintenance schemas (Y-10)
  registeredSchemaMap.set(
    'CrmMaintenanceStatus',
    registry.register('CrmMaintenanceStatus', crmMaintenanceSchemas.CrmMaintenanceStatusSchema),
  );
  registeredSchemaMap.set(
    'CrmMaintenanceSortBy',
    registry.register('CrmMaintenanceSortBy', crmMaintenanceSchemas.CrmMaintenanceSortSchema),
  );
  registeredSchemaMap.set(
    'CrmMaintenance',
    registry.register('CrmMaintenance', crmMaintenanceSchemas.CrmMaintenanceSchema),
  );
  registeredSchemaMap.set(
    'CrmMaintenanceAllowedUser',
    registry.register(
      'CrmMaintenanceAllowedUser',
      crmMaintenanceSchemas.CrmMaintenanceAllowedUserResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'CrmMaintenanceItemResponse',
    registry.register(
      'CrmMaintenanceItemResponse',
      crmMaintenanceSchemas.CrmMaintenanceItemResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'CrmMaintenanceDetailResponse',
    registry.register(
      'CrmMaintenanceDetailResponse',
      crmMaintenanceSchemas.CrmMaintenanceDetailResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'GetCrmMaintenancesQuery',
    registry.register(
      'GetCrmMaintenancesQuery',
      crmMaintenanceSchemas.GetCrmMaintenancesQuerySchema,
    ),
  );
  registeredSchemaMap.set(
    'CreateCrmMaintenanceBody',
    registry.register(
      'CreateCrmMaintenanceBody',
      crmMaintenanceSchemas.CreateCrmMaintenanceBodySchema,
    ),
  );
  registeredSchemaMap.set(
    'UpdateCrmMaintenanceBody',
    registry.register(
      'UpdateCrmMaintenanceBody',
      crmMaintenanceSchemas.UpdateCrmMaintenanceBodySchema,
    ),
  );
  // Register banner schemas
  registeredSchemaMap.set(
    'BannerChannel',
    registry.register('BannerChannel', bannerSchemas.BannerChannelSchema),
  );
  registeredSchemaMap.set(
    'BannerStatus',
    registry.register('BannerStatus', bannerSchemas.BannerStatusSchema),
  );
  registeredSchemaMap.set(
    'BannerSortBy',
    registry.register('BannerSortBy', bannerSchemas.BannerSortSchema),
  );
  registeredSchemaMap.set('Banner', registry.register('Banner', bannerSchemas.BannerSchema));
  registeredSchemaMap.set(
    'BannerItemResponse',
    registry.register('BannerItemResponse', bannerSchemas.BannerItemResponseSchema),
  );
  registeredSchemaMap.set(
    'BannerDisplayOrderItem',
    registry.register('BannerDisplayOrderItem', bannerSchemas.BannerDisplayOrderItemSchema),
  );
  registeredSchemaMap.set(
    'GetBannersQuery',
    registry.register('GetBannersQuery', bannerSchemas.GetBannersQueryParamsSchema),
  );
  registeredSchemaMap.set(
    'CreateBannerBody',
    registry.register('CreateBannerBody', bannerSchemas.CreateBannerBodySchema),
  );
  registeredSchemaMap.set(
    'UpdateBannerBody',
    registry.register('UpdateBannerBody', bannerSchemas.UpdateBannerBodySchema),
  );

  // Register banner schemas
  registeredSchemaMap.set(
    'BannerChannel',
    registry.register('BannerChannel', bannerSchemas.BannerChannelSchema),
  );
  registeredSchemaMap.set(
    'BannerStatus',
    registry.register('BannerStatus', bannerSchemas.BannerStatusSchema),
  );
  registeredSchemaMap.set(
    'BannerSortBy',
    registry.register('BannerSortBy', bannerSchemas.BannerSortSchema),
  );
  registeredSchemaMap.set('Banner', registry.register('Banner', bannerSchemas.BannerSchema));
  registeredSchemaMap.set(
    'BannerItemResponse',
    registry.register('BannerItemResponse', bannerSchemas.BannerItemResponseSchema),
  );
  registeredSchemaMap.set(
    'BannerDisplayOrderItem',
    registry.register('BannerDisplayOrderItem', bannerSchemas.BannerDisplayOrderItemSchema),
  );
  registeredSchemaMap.set(
    'GetBannersQuery',
    registry.register('GetBannersQuery', bannerSchemas.GetBannersQueryParamsSchema),
  );
  registeredSchemaMap.set(
    'CreateBannerBody',
    registry.register('CreateBannerBody', bannerSchemas.CreateBannerBodySchema),
  );
  registeredSchemaMap.set(
    'UpdateBannerBody',
    registry.register('UpdateBannerBody', bannerSchemas.UpdateBannerBodySchema),
  );

  // Register article category schemas
  registeredSchemaMap.set(
    'ArticleCategoryType',
    registry.register('ArticleCategoryType', articleCategorySchemas.ArticleCategoryTypeSchema),
  );
  registeredSchemaMap.set(
    'ArticleCategorySort',
    registry.register('ArticleCategorySort', articleCategorySchemas.ArticleCategorySortSchema),
  );
  registeredSchemaMap.set(
    'ArticleCategory',
    registry.register('ArticleCategory', articleCategorySchemas.ArticleCategorySchema),
  );
  registeredSchemaMap.set(
    'ArticleCategoryItemResponse',
    registry.register(
      'ArticleCategoryItemResponse',
      articleCategorySchemas.ArticleCategoryItemResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'GetArticleCategoriesQueryParams',
    registry.register(
      'GetArticleCategoriesQueryParams',
      articleCategorySchemas.GetArticleCategoriesQueryParamsSchema,
    ),
  );
  registeredSchemaMap.set(
    'CreateArticleCategoryBody',
    registry.register(
      'CreateArticleCategoryBody',
      articleCategorySchemas.CreateArticleCategoryBodySchema,
    ),
  );
  registeredSchemaMap.set(
    'UpdateArticleCategoryBody',
    registry.register(
      'UpdateArticleCategoryBody',
      articleCategorySchemas.UpdateArticleCategoryBodySchema,
    ),
  );

  // Register campaign schemas
  registeredSchemaMap.set(
    'CampaignDiscountType',
    registry.register('CampaignDiscountType', campaignSchemas.CampaignDiscountTypeSchema),
  );
  registeredSchemaMap.set(
    'CampaignApplyStartMonth',
    registry.register('CampaignApplyStartMonth', campaignSchemas.CampaignApplyStartMonthSchema),
  );
  registeredSchemaMap.set(
    'CampaignTargetSex',
    registry.register('CampaignTargetSex', campaignSchemas.CampaignTargetSexSchema),
  );
  registeredSchemaMap.set(
    'CampaignAcceptState',
    registry.register('CampaignAcceptState', campaignSchemas.CampaignAcceptStateSchema),
  );
  registeredSchemaMap.set(
    'CampaignPublishScope',
    registry.register('CampaignPublishScope', campaignSchemas.CampaignPublishScopeSchema),
  );
  registeredSchemaMap.set(
    'CampaignSort',
    registry.register('CampaignSort', campaignSchemas.CampaignSortSchema),
  );
  registeredSchemaMap.set(
    'CampaignErrorResponse',
    registry.register('CampaignErrorResponse', campaignSchemas.CampaignErrorResponseSchema),
  );
  registeredSchemaMap.set(
    'CampaignOptionDiscount',
    registry.register('CampaignOptionDiscount', campaignSchemas.CampaignOptionDiscountSchema),
  );
  registeredSchemaMap.set(
    'CampaignOptionDiscountInput',
    registry.register(
      'CampaignOptionDiscountInput',
      campaignSchemas.CampaignOptionDiscountInputSchema,
    ),
  );
  registeredSchemaMap.set(
    'CampaignAutoOption',
    registry.register('CampaignAutoOption', campaignSchemas.CampaignAutoOptionSchema),
  );
  registeredSchemaMap.set(
    'CampaignAutoOptionInput',
    registry.register('CampaignAutoOptionInput', campaignSchemas.CampaignAutoOptionInputSchema),
  );
  registeredSchemaMap.set(
    'CampaignReferralSettings',
    registry.register('CampaignReferralSettings', campaignSchemas.CampaignReferralSettingsSchema),
  );
  registeredSchemaMap.set(
    'CampaignReferralSettingsInput',
    registry.register(
      'CampaignReferralSettingsInput',
      campaignSchemas.CampaignReferralSettingsInputSchema,
    ),
  );
  registeredSchemaMap.set(
    'CampaignEnrollmentChannels',
    registry.register(
      'CampaignEnrollmentChannels',
      campaignSchemas.CampaignEnrollmentChannelsSchema,
    ),
  );
  registeredSchemaMap.set(
    'CampaignStats',
    registry.register('CampaignStats', campaignSchemas.CampaignStatsSchema),
  );
  registeredSchemaMap.set(
    'CampaignOptionRef',
    registry.register('CampaignOptionRef', campaignSchemas.CampaignOptionRefSchema),
  );
  registeredSchemaMap.set(
    'CampaignStoreRef',
    registry.register('CampaignStoreRef', campaignSchemas.CampaignStoreRefSchema),
  );
  registeredSchemaMap.set(
    'CampaignStoreUsage',
    registry.register('CampaignStoreUsage', campaignSchemas.CampaignStoreUsageSchema),
  );
  registeredSchemaMap.set(
    'CampaignChangeHistoryItem',
    registry.register('CampaignChangeHistoryItem', campaignSchemas.CampaignChangeHistoryItemSchema),
  );
  registeredSchemaMap.set(
    'CampaignListItemResponse',
    registry.register('CampaignListItemResponse', campaignSchemas.CampaignListItemResponseSchema),
  );
  registeredSchemaMap.set(
    'CampaignDetailResponse',
    registry.register('CampaignDetailResponse', campaignSchemas.CampaignDetailResponseSchema),
  );
  registeredSchemaMap.set(
    'CreateCampaignBody',
    registry.register('CreateCampaignBody', campaignSchemas.CreateCampaignBodySchema),
  );
  registeredSchemaMap.set(
    'UpdateCampaignBody',
    registry.register('UpdateCampaignBody', campaignSchemas.UpdateCampaignBodySchema),
  );
  registeredSchemaMap.set(
    'ExerciseStatus',
    registry.register('ExerciseStatus', exerciseSchemas.ExerciseStatusSchema),
  );
  registeredSchemaMap.set(
    'ExerciseLevel',
    registry.register('ExerciseLevel', exerciseSchemas.ExerciseLevelSchema),
  );
  registeredSchemaMap.set(
    'ExerciseHandUsage',
    registry.register('ExerciseHandUsage', exerciseSchemas.ExerciseHandUsageSchema),
  );
  registeredSchemaMap.set(
    'ExerciseDeleteBlockReason',
    registry.register('ExerciseDeleteBlockReason', exerciseSchemas.ExerciseDeleteBlockReasonSchema),
  );
  registeredSchemaMap.set(
    'ExerciseMasterStatus',
    registry.register('ExerciseMasterStatus', exerciseMasterSchemas.ExerciseMasterStatusSchema),
  );
  registeredSchemaMap.set(
    'ExerciseMasterDeleteBlockReason',
    registry.register(
      'ExerciseMasterDeleteBlockReason',
      exerciseMasterSchemas.ExerciseMasterDeleteBlockReasonSchema,
    ),
  );
  registeredSchemaMap.set(
    'ExerciseMasterListItem',
    registry.register('ExerciseMasterListItem', exerciseMasterSchemas.ExerciseMasterListItemSchema),
  );
  registeredSchemaMap.set(
    'ExerciseMasterDetail',
    registry.register('ExerciseMasterDetail', exerciseMasterSchemas.ExerciseMasterDetailSchema),
  );
  registeredSchemaMap.set(
    'GetExerciseMasterListQuery',
    registry.register(
      'GetExerciseMasterListQuery',
      exerciseMasterSchemas.GetExerciseMasterListQuerySchema,
    ),
  );
  registeredSchemaMap.set(
    'GetExerciseMasterListResponse',
    registry.register(
      'GetExerciseMasterListResponse',
      exerciseMasterSchemas.GetExerciseMasterListResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'GetExerciseMasterDetailResponse',
    registry.register(
      'GetExerciseMasterDetailResponse',
      exerciseMasterSchemas.GetExerciseMasterDetailResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'CreateExerciseMasterBody',
    registry.register(
      'CreateExerciseMasterBody',
      exerciseMasterSchemas.CreateExerciseMasterBodySchema,
    ),
  );
  registeredSchemaMap.set(
    'UpdateExerciseMasterBody',
    registry.register(
      'UpdateExerciseMasterBody',
      exerciseMasterSchemas.UpdateExerciseMasterBodySchema,
    ),
  );
  registeredSchemaMap.set(
    'CreateExerciseMasterResponse',
    registry.register(
      'CreateExerciseMasterResponse',
      exerciseMasterSchemas.CreateExerciseMasterResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'UpdateExerciseMasterResponse',
    registry.register(
      'UpdateExerciseMasterResponse',
      exerciseMasterSchemas.UpdateExerciseMasterResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'DeleteExerciseMasterResponse',
    registry.register(
      'DeleteExerciseMasterResponse',
      exerciseMasterSchemas.DeleteExerciseMasterResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'DeleteExerciseMasterBlockedResponse',
    registry.register(
      'DeleteExerciseMasterBlockedResponse',
      exerciseMasterSchemas.DeleteExerciseMasterBlockedResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'ExerciseEquipmentOption',
    registry.register('ExerciseEquipmentOption', exerciseSchemas.ExerciseEquipmentOptionSchema),
  );
  registeredSchemaMap.set(
    'ExerciseListItem',
    registry.register('ExerciseListItem', exerciseSchemas.ExerciseListItemSchema),
  );
  registeredSchemaMap.set(
    'ExercisePagination',
    registry.register('ExercisePagination', exerciseSchemas.ExercisePaginationSchema),
  );
  registeredSchemaMap.set(
    'GetExercisesQuery',
    registry.register('GetExercisesQuery', exerciseSchemas.GetExercisesQuerySchema),
  );
  registeredSchemaMap.set(
    'GetExercisesResponse',
    registry.register('GetExercisesResponse', exerciseSchemas.GetExercisesResponseSchema),
  );
  registeredSchemaMap.set(
    'ExerciseImage',
    registry.register('ExerciseImage', exerciseSchemas.ExerciseImageSchema),
  );
  registeredSchemaMap.set(
    'ExerciseStep',
    registry.register('ExerciseStep', exerciseSchemas.ExerciseStepSchema),
  );
  registeredSchemaMap.set(
    'ExerciseTagSetting',
    registry.register('ExerciseTagSetting', exerciseSchemas.ExerciseTagSettingSchema),
  );
  registeredSchemaMap.set(
    'ExerciseDetail',
    registry.register('ExerciseDetail', exerciseSchemas.ExerciseDetailSchema),
  );
  registeredSchemaMap.set(
    'GetExerciseDetailResponse',
    registry.register('GetExerciseDetailResponse', exerciseSchemas.GetExerciseDetailResponseSchema),
  );
  registeredSchemaMap.set(
    'ExerciseStepInput',
    registry.register('ExerciseStepInput', exerciseSchemas.ExerciseStepInputSchema),
  );
  registeredSchemaMap.set(
    'UpsertExerciseBody',
    registry.register('UpsertExerciseBody', exerciseSchemas.UpsertExerciseBodySchema),
  );
  registeredSchemaMap.set(
    'CreateExerciseResponse',
    registry.register('CreateExerciseResponse', exerciseSchemas.CreateExerciseResponseSchema),
  );
  registeredSchemaMap.set(
    'UpdateExerciseResponse',
    registry.register('UpdateExerciseResponse', exerciseSchemas.UpdateExerciseResponseSchema),
  );
  registeredSchemaMap.set(
    'UpdateExercisePublishStatusBody',
    registry.register(
      'UpdateExercisePublishStatusBody',
      exerciseSchemas.UpdateExercisePublishStatusBodySchema,
    ),
  );
  registeredSchemaMap.set(
    'UpdateExercisePublishStatusResponse',
    registry.register(
      'UpdateExercisePublishStatusResponse',
      exerciseSchemas.UpdateExercisePublishStatusResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'DeleteExerciseResponse',
    registry.register('DeleteExerciseResponse', exerciseSchemas.DeleteExerciseResponseSchema),
  );
  registeredSchemaMap.set(
    'DeleteExerciseBlockedResponse',
    registry.register(
      'DeleteExerciseBlockedResponse',
      exerciseSchemas.DeleteExerciseBlockedResponseSchema,
    ),
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
    'FranchiseCompanyAuthMethod',
    registry.register(
      'FranchiseCompanyAuthMethod',
      franchiseCompanySchemas.FranchiseCompanyAuthMethodSchema,
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

  // Register promo code schemas
  registeredSchemaMap.set(
    'PromoCodeScope',
    registry.register('PromoCodeScope', promoCodeSchemas.PromoCodeScopeSchema),
  );
  registeredSchemaMap.set(
    'PromoCodeStatus',
    registry.register('PromoCodeStatus', promoCodeSchemas.PromoCodeStatusSchema),
  );
  registeredSchemaMap.set(
    'PromoCodeEffectiveStatus',
    registry.register('PromoCodeEffectiveStatus', promoCodeSchemas.PromoCodeEffectiveStatusSchema),
  );
  registeredSchemaMap.set(
    'PromoCodeGenerationMethod',
    registry.register(
      'PromoCodeGenerationMethod',
      promoCodeSchemas.PromoCodeGenerationMethodSchema,
    ),
  );
  registeredSchemaMap.set(
    'PromoCodeStatusToggleAction',
    registry.register(
      'PromoCodeStatusToggleAction',
      promoCodeSchemas.PromoCodeStatusToggleActionSchema,
    ),
  );
  registeredSchemaMap.set(
    'PromoCodeSort',
    registry.register('PromoCodeSort', promoCodeSchemas.PromoCodeSortSchema),
  );
  registeredSchemaMap.set(
    'PromoCodeErrorResponse',
    registry.register('PromoCodeErrorResponse', promoCodeSchemas.PromoCodeErrorResponseSchema),
  );
  registeredSchemaMap.set(
    'PromoCodeListItemResponse',
    registry.register(
      'PromoCodeListItemResponse',
      promoCodeSchemas.PromoCodeListItemResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'CreatePromoCodeBody',
    registry.register('CreatePromoCodeBody', promoCodeSchemas.CreatePromoCodeBodySchema),
  );
  registeredSchemaMap.set(
    'UpdatePromoCodeStatusBody',
    registry.register(
      'UpdatePromoCodeStatusBody',
      promoCodeSchemas.UpdatePromoCodeStatusBodySchema,
    ),
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
    'EnrollmentRoute',
    registry.register('EnrollmentRoute', membershipApplicationSchemas.EnrollmentRouteSchema),
  );
  registeredSchemaMap.set(
    'RejectionReason',
    registry.register('RejectionReason', membershipApplicationSchemas.RejectionReasonSchema),
  );
  registeredSchemaMap.set(
    'BlacklistCheckState',
    registry.register(
      'BlacklistCheckState',
      membershipApplicationSchemas.BlacklistCheckStateSchema,
    ),
  );
  registeredSchemaMap.set(
    'EnrollmentFeeExemptionKind',
    registry.register(
      'EnrollmentFeeExemptionKind',
      membershipApplicationSchemas.EnrollmentFeeExemptionKindSchema,
    ),
  );
  registeredSchemaMap.set(
    'MembershipApplicationSummary',
    registry.register(
      'MembershipApplicationSummary',
      membershipApplicationSchemas.MembershipApplicationSummarySchema,
    ),
  );
  registeredSchemaMap.set(
    'TimelineEntry',
    registry.register('TimelineEntry', membershipApplicationSchemas.TimelineEntrySchema),
  );
  registeredSchemaMap.set(
    'BlacklistCondition',
    registry.register('BlacklistCondition', membershipApplicationSchemas.BlacklistConditionSchema),
  );
  registeredSchemaMap.set(
    'FeeRow',
    registry.register('FeeRow', membershipApplicationSchemas.FeeRowSchema),
  );
  registeredSchemaMap.set(
    'EnrollmentFeeExemption',
    registry.register(
      'EnrollmentFeeExemption',
      membershipApplicationSchemas.EnrollmentFeeExemptionSchema,
    ),
  );
  registeredSchemaMap.set(
    'CompanionUpgrade',
    registry.register('CompanionUpgrade', membershipApplicationSchemas.CompanionUpgradeSchema),
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

  // Register position / store masters (Y-01 feature 017)
  registeredSchemaMap.set(
    'PositionRoleCategory',
    registry.register('PositionRoleCategory', positionSchemas.PositionRoleCategorySchema),
  );
  registeredSchemaMap.set(
    'PositionPermissionKey',
    registry.register('PositionPermissionKey', positionSchemas.PositionPermissionKeySchema),
  );
  registeredSchemaMap.set(
    'PositionPermissionMap',
    registry.register('PositionPermissionMap', positionSchemas.PermissionMapSchema),
  );
  registeredSchemaMap.set(
    'PositionPermissionMapPartial',
    registry.register('PositionPermissionMapPartial', positionSchemas.PermissionMapPartialSchema),
  );
  registeredSchemaMap.set(
    'Position',
    registry.register('Position', positionSchemas.PositionSchema),
  );
  registeredSchemaMap.set(
    'PositionListItem',
    registry.register('PositionListItem', positionSchemas.PositionListItemSchema),
  );
  registeredSchemaMap.set(
    'PositionPagination',
    registry.register('PositionPagination', positionSchemas.PositionPaginationSchema),
  );
  registeredSchemaMap.set(
    'GetPositionsQuery',
    registry.register('GetPositionsQuery', positionSchemas.GetPositionsQuerySchema),
  );
  registeredSchemaMap.set(
    'PositionDetail',
    registry.register('PositionDetail', positionSchemas.PositionDetailSchema),
  );
  registeredSchemaMap.set(
    'CreatePositionBody',
    registry.register('CreatePositionBody', positionSchemas.CreatePositionBodySchema),
  );
  registeredSchemaMap.set(
    'CreatePositionResponse',
    registry.register('CreatePositionResponse', positionSchemas.CreatePositionResponseSchema),
  );
  registeredSchemaMap.set(
    'UpdatePositionBody',
    registry.register('UpdatePositionBody', positionSchemas.UpdatePositionBodySchema),
  );
  registeredSchemaMap.set(
    'UpdatePositionResponse',
    registry.register('UpdatePositionResponse', positionSchemas.UpdatePositionResponseSchema),
  );
  registeredSchemaMap.set(
    'PositionPermissionCategoryKey',
    registry.register('PositionPermissionCategoryKey', positionSchemas.PositionCategoryKeySchema),
  );
  registeredSchemaMap.set(
    'PositionPermissionItem',
    registry.register('PositionPermissionItem', positionSchemas.PositionPermissionItemSchema),
  );
  registeredSchemaMap.set(
    'PositionPermissionCategory',
    registry.register(
      'PositionPermissionCategory',
      positionSchemas.PositionPermissionCategorySchema,
    ),
  );
  registeredSchemaMap.set(
    'GetPositionPermissionsResponse',
    registry.register(
      'GetPositionPermissionsResponse',
      positionSchemas.GetPositionPermissionsResponseSchema,
    ),
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
  registeredSchemaMap.set(
    'BrandEnum',
    registry.register('BrandEnum', brandSchemas.BrandEnumSchema),
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
    'DeleteStaffResponse',
    registry.register('DeleteStaffResponse', staffSchemas.DeleteStaffResponseSchema),
  );
  registeredSchemaMap.set(
    'StaffPermissionHistoryEntry',
    registry.register(
      'StaffPermissionHistoryEntry',
      staffSchemas.StaffPermissionHistoryEntrySchema,
    ),
  );
  registeredSchemaMap.set(
    'GetStaffPermissionHistoryResponse',
    registry.register(
      'GetStaffPermissionHistoryResponse',
      staffSchemas.GetStaffPermissionHistoryResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'DeactivateStaffRequest',
    registry.register('DeactivateStaffRequest', staffSchemas.DeactivateStaffRequestSchema),
  );
  registeredSchemaMap.set(
    'DeactivateStaffResponse',
    registry.register('DeactivateStaffResponse', staffSchemas.DeactivateStaffResponseSchema),
  );
  registeredSchemaMap.set(
    'ResendInviteResponse',
    registry.register('ResendInviteResponse', staffSchemas.ResendInviteResponseSchema),
  );
  registeredSchemaMap.set(
    'MagicLinkResponse',
    registry.register('MagicLinkResponse', staffSchemas.MagicLinkResponseSchema),
  );
  registeredSchemaMap.set(
    'CreateStaffsRequest',
    registry.register('CreateStaffsRequest', staffSchemas.CreateStaffsRequestSchema),
  );
  registeredSchemaMap.set(
    'CreateStaffsResponse',
    registry.register('CreateStaffsResponse', staffSchemas.CreateStaffsResponseSchema),
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
  registeredSchemaMap.set(
    'LeaveListStatus',
    registry.register('LeaveListStatus', leaveSchemas.LeaveListStatusSchema),
  );
  registeredSchemaMap.set(
    'CancellationBlockedReason',
    registry.register('CancellationBlockedReason', leaveSchemas.CancellationBlockedReasonSchema),
  );
  registeredSchemaMap.set(
    'ProxyAgreementMethod',
    registry.register('ProxyAgreementMethod', leaveSchemas.ProxyAgreementMethodSchema),
  );
  registeredSchemaMap.set(
    'SuspensionHistoryStatus',
    registry.register('SuspensionHistoryStatus', leaveSchemas.SuspensionHistoryStatusSchema),
  );
  registeredSchemaMap.set(
    'SuspensionHistoryMonth',
    registry.register('SuspensionHistoryMonth', leaveSchemas.SuspensionHistoryMonthSchema),
  );
  registeredSchemaMap.set(
    'LeaveMember',
    registry.register('LeaveMember', leaveSchemas.LeaveMemberSchema),
  );
  registeredSchemaMap.set(
    'LeaveDetail',
    registry.register('LeaveDetail', leaveSchemas.LeaveDetailSchema),
  );
  registeredSchemaMap.set(
    'GetLeaveDetailResponse',
    registry.register('GetLeaveDetailResponse', leaveSchemas.GetLeaveDetailResponseSchema),
  );
  registeredSchemaMap.set(
    'CancelWithdrawalRequest',
    registry.register('CancelWithdrawalRequest', leaveSchemas.CancelWithdrawalRequestSchema),
  );
  registeredSchemaMap.set(
    'LeaveActionResponse',
    registry.register('LeaveActionResponse', leaveSchemas.LeaveActionResponseSchema),
  );

  // Register blacklist schemas
  registeredSchemaMap.set(
    'BlacklistSource',
    registry.register('BlacklistSource', blacklistSchemas.BlacklistSourceSchema),
  );
  registeredSchemaMap.set(
    'BlacklistReasonCategory',
    registry.register('BlacklistReasonCategory', blacklistSchemas.BlacklistReasonCategorySchema),
  );
  registeredSchemaMap.set(
    'BlacklistHistoryEvent',
    registry.register('BlacklistHistoryEvent', blacklistSchemas.BlacklistHistoryEventSchema),
  );
  registeredSchemaMap.set(
    'UnpaidFilter',
    registry.register('UnpaidFilter', blacklistSchemas.UnpaidFilterSchema),
  );

  // Register withdraw schemas
  // A-01 FR-014: the free-text 退会理由 replaced the former WithdrawReason picklist; what is
  // enumerated now is the *derived* withdrawal type, not the member's motivation.
  registeredSchemaMap.set(
    'WithdrawalType',
    registry.register('WithdrawalType', memberSchemas.WithdrawalTypeSchema),
  );

  // Register 代理申請 schemas (A-01 FR-017) — shared by 休会 / 退会 / 移籍
  registeredSchemaMap.set(
    'ProxyAgreementMethod',
    registry.register('ProxyAgreementMethod', memberSchemas.ProxyAgreementMethodSchema),
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
    'GateStopPattern',
    registry.register('GateStopPattern', memberSchemas.GateStopPatternSchema),
  );
  registeredSchemaMap.set(
    'GateStopSetPattern',
    registry.register('GateStopSetPattern', memberSchemas.GateStopSetPatternSchema),
  );
  registeredSchemaMap.set(
    'NotificationTopic',
    registry.register('NotificationTopic', memberSchemas.NotificationTopicSchema),
  );
  registeredSchemaMap.set(
    'NotificationPreference',
    registry.register('NotificationPreference', memberSchemas.NotificationPreferenceSchema),
  );
  registeredSchemaMap.set(
    'MemberFamilyBundle',
    registry.register('MemberFamilyBundle', memberSchemas.MemberFamilyBundleSchema),
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
    'SurveyStoreVisibilityChoice',
    registry.register(
      'SurveyStoreVisibilityChoice',
      surveySchemas.SurveyStoreVisibilityChoiceSchema,
    ),
  );
  registeredSchemaMap.set(
    'SurveyStoreVisibilityQuestion',
    registry.register(
      'SurveyStoreVisibilityQuestion',
      surveySchemas.SurveyStoreVisibilityQuestionSchema,
    ),
  );
  registeredSchemaMap.set(
    'SurveyStoreVisibility',
    registry.register('SurveyStoreVisibility', surveySchemas.SurveyStoreVisibilitySchema),
  );
  registeredSchemaMap.set(
    'GetSurveyStoreVisibilityResponse',
    registry.register(
      'GetSurveyStoreVisibilityResponse',
      surveySchemas.GetSurveyStoreVisibilityResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'UpdateSurveyStoreVisibilityBody',
    registry.register(
      'UpdateSurveyStoreVisibilityBody',
      surveySchemas.UpdateSurveyStoreVisibilityBodySchema,
    ),
  );
  registeredSchemaMap.set(
    'UpdateSurveyStoreVisibilityResponse',
    registry.register(
      'UpdateSurveyStoreVisibilityResponse',
      surveySchemas.UpdateSurveyStoreVisibilityResponseSchema,
    ),
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
    'InstallationStatus',
    registry.register('InstallationStatus', trainingEquipmentSchemas.InstallationStatusSchema),
  );
  registeredSchemaMap.set(
    'LocationInGym',
    registry.register('LocationInGym', trainingEquipmentSchemas.LocationInGymSchema),
  );
  registeredSchemaMap.set(
    'ToolTypeCode',
    registry.register('ToolTypeCode', trainingEquipmentSchemas.ToolTypeCodeSchema),
  );
  registeredSchemaMap.set(
    'TrainingEquipmentToolType',
    registry.register(
      'TrainingEquipmentToolType',
      trainingEquipmentSchemas.TrainingEquipmentToolTypeSchema,
    ),
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
    'TrainingEquipmentPagination',
    registry.register(
      'TrainingEquipmentPagination',
      trainingEquipmentSchemas.TrainingEquipmentPaginationSchema,
    ),
  );
  registeredSchemaMap.set(
    'TrainingEquipmentListItem',
    registry.register(
      'TrainingEquipmentListItem',
      trainingEquipmentSchemas.TrainingEquipmentListItemSchema,
    ),
  );
  registeredSchemaMap.set(
    'TrainingEquipmentLinkedExercise',
    registry.register(
      'TrainingEquipmentLinkedExercise',
      trainingEquipmentSchemas.TrainingEquipmentLinkedExerciseSchema,
    ),
  );
  registeredSchemaMap.set(
    'TrainingEquipmentStatusCard',
    registry.register(
      'TrainingEquipmentStatusCard',
      trainingEquipmentSchemas.TrainingEquipmentStatusCardSchema,
    ),
  );
  registeredSchemaMap.set(
    'TrainingEquipmentDetail',
    registry.register(
      'TrainingEquipmentDetail',
      trainingEquipmentSchemas.TrainingEquipmentDetailSchema,
    ),
  );
  registeredSchemaMap.set(
    'ListTrainingEquipmentQuery',
    registry.register(
      'ListTrainingEquipmentQuery',
      trainingEquipmentSchemas.ListTrainingEquipmentQuerySchema,
    ),
  );
  registeredSchemaMap.set(
    'ListTrainingEquipmentResponse',
    registry.register(
      'ListTrainingEquipmentResponse',
      trainingEquipmentSchemas.ListTrainingEquipmentResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'CreateTrainingEquipmentRequest',
    registry.register(
      'CreateTrainingEquipmentRequest',
      trainingEquipmentSchemas.CreateTrainingEquipmentRequestSchema,
    ),
  );
  registeredSchemaMap.set(
    'UpdateTrainingEquipmentRequest',
    registry.register(
      'UpdateTrainingEquipmentRequest',
      trainingEquipmentSchemas.UpdateTrainingEquipmentRequestSchema,
    ),
  );
  registeredSchemaMap.set(
    'ChangeInstallationStatusRequest',
    registry.register(
      'ChangeInstallationStatusRequest',
      trainingEquipmentSchemas.ChangeInstallationStatusRequestSchema,
    ),
  );
  registeredSchemaMap.set(
    'ChangeInstallationStatusResponse',
    registry.register(
      'ChangeInstallationStatusResponse',
      trainingEquipmentSchemas.ChangeInstallationStatusResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'BulkUpdateInstallationStatusRequest',
    registry.register(
      'BulkUpdateInstallationStatusRequest',
      trainingEquipmentSchemas.BulkUpdateInstallationStatusRequestSchema,
    ),
  );
  registeredSchemaMap.set(
    'BulkUpdateInstallationStatusResponse',
    registry.register(
      'BulkUpdateInstallationStatusResponse',
      trainingEquipmentSchemas.BulkUpdateInstallationStatusResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'TrainingEquipmentStatusHistoryItem',
    registry.register(
      'TrainingEquipmentStatusHistoryItem',
      trainingEquipmentSchemas.TrainingEquipmentStatusHistoryItemSchema,
    ),
  );
  registeredSchemaMap.set(
    'ListEquipmentStatusHistoryResponse',
    registry.register(
      'ListEquipmentStatusHistoryResponse',
      trainingEquipmentSchemas.ListEquipmentStatusHistoryResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'ListEquipmentExerciseLinksResponse',
    registry.register(
      'ListEquipmentExerciseLinksResponse',
      trainingEquipmentSchemas.ListEquipmentExerciseLinksResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'AddEquipmentExerciseLinksRequest',
    registry.register(
      'AddEquipmentExerciseLinksRequest',
      trainingEquipmentSchemas.AddEquipmentExerciseLinksRequestSchema,
    ),
  );
  registeredSchemaMap.set(
    'AddEquipmentExerciseLinksResponse',
    registry.register(
      'AddEquipmentExerciseLinksResponse',
      trainingEquipmentSchemas.AddEquipmentExerciseLinksResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'TrainingEquipmentExerciseCandidate',
    registry.register(
      'TrainingEquipmentExerciseCandidate',
      trainingEquipmentSchemas.TrainingEquipmentExerciseCandidateSchema,
    ),
  );
  registeredSchemaMap.set(
    'ListEquipmentExerciseCandidatesQuery',
    registry.register(
      'ListEquipmentExerciseCandidatesQuery',
      trainingEquipmentSchemas.ListEquipmentExerciseCandidatesQuerySchema,
    ),
  );
  registeredSchemaMap.set(
    'ListEquipmentExerciseCandidatesResponse',
    registry.register(
      'ListEquipmentExerciseCandidatesResponse',
      trainingEquipmentSchemas.ListEquipmentExerciseCandidatesResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'ExportTrainingEquipmentQuery',
    registry.register(
      'ExportTrainingEquipmentQuery',
      trainingEquipmentSchemas.ExportTrainingEquipmentQuerySchema,
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

  // Register transfer schemas (A-02 移籍管理).
  // Registering the enums by name is what gives the UI a `TransferStatus` / `ExclusionReason`
  // type in types.gen.ts, so no component has to hand-declare a status union (Constitution II).
  registeredSchemaMap.set(
    'TransferStatus',
    registry.register('TransferStatus', transferSchemas.TransferStatusSchema),
  );
  registeredSchemaMap.set(
    'TransferBrand',
    registry.register('TransferBrand', transferSchemas.TransferBrandSchema),
  );
  registeredSchemaMap.set(
    'ExclusionReason',
    registry.register('ExclusionReason', transferSchemas.ExclusionReasonSchema),
  );
  registeredSchemaMap.set(
    'TransferRequest',
    registry.register('TransferRequest', transferSchemas.TransferRequestSchema),
  );
  registeredSchemaMap.set(
    'ApprovalHistoryItem',
    registry.register('ApprovalHistoryItem', transferSchemas.ApprovalHistoryItemSchema),
  );
  registeredSchemaMap.set(
    'TransferDecision',
    registry.register('TransferDecision', transferSchemas.TransferDecisionSchema),
  );
  registeredSchemaMap.set(
    'TransferUnlock',
    registry.register('TransferUnlock', transferSchemas.TransferUnlockSchema),
  );
  registeredSchemaMap.set(
    'TransferDetail',
    registry.register('TransferDetail', transferSchemas.TransferDetailSchema),
  );
  registeredSchemaMap.set(
    'TransferPagination',
    registry.register('TransferPagination', transferSchemas.TransferPaginationSchema),
  );
  registeredSchemaMap.set(
    'GetTransfersQuery',
    registry.register('GetTransfersQuery', transferSchemas.GetTransfersQuerySchema),
  );
  registeredSchemaMap.set(
    'GetTransfersResponse',
    registry.register('GetTransfersResponse', transferSchemas.GetTransfersResponseSchema),
  );
  registeredSchemaMap.set(
    'GetTransferDetailResponse',
    registry.register('GetTransferDetailResponse', transferSchemas.GetTransferDetailResponseSchema),
  );
  registeredSchemaMap.set(
    'ApproveTransferBody',
    registry.register('ApproveTransferBody', transferSchemas.ApproveTransferBodySchema),
  );
  registeredSchemaMap.set(
    'RejectTransferBody',
    registry.register('RejectTransferBody', transferSchemas.RejectTransferBodySchema),
  );
  registeredSchemaMap.set(
    'BulkApproveTransfersBody',
    registry.register('BulkApproveTransfersBody', transferSchemas.BulkApproveTransfersBodySchema),
  );
  registeredSchemaMap.set(
    'UnlockTransferBody',
    registry.register('UnlockTransferBody', transferSchemas.UnlockTransferBodySchema),
  );
  registeredSchemaMap.set(
    'ApproveTransferResponse',
    registry.register('ApproveTransferResponse', transferSchemas.ApproveTransferResponseSchema),
  );
  registeredSchemaMap.set(
    'RejectTransferResponse',
    registry.register('RejectTransferResponse', transferSchemas.RejectTransferResponseSchema),
  );
  registeredSchemaMap.set(
    'BulkApproveTransfersResponse',
    registry.register(
      'BulkApproveTransfersResponse',
      transferSchemas.BulkApproveTransfersResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'UnlockTransferResponse',
    registry.register('UnlockTransferResponse', transferSchemas.UnlockTransferResponseSchema),
  );
  // Register billing (Sales Management, F-01) schemas
  registeredSchemaMap.set(
    'BillingType',
    registry.register('BillingType', billingSchemas.BillingTypeSchema),
  );
  registeredSchemaMap.set(
    'PaymentMethod',
    registry.register('PaymentMethod', billingSchemas.PaymentMethodSchema),
  );
  registeredSchemaMap.set(
    'ConfirmationStatus',
    registry.register('ConfirmationStatus', billingSchemas.ConfirmationStatusSchema),
  );
  registeredSchemaMap.set(
    'BillingRefundStatus',
    registry.register('BillingRefundStatus', billingSchemas.BillingRefundStatusSchema),
  );
  registeredSchemaMap.set(
    'LineItemSource',
    registry.register('LineItemSource', billingSchemas.LineItemSourceSchema),
  );
  registeredSchemaMap.set(
    'LineItemPaymentStatus',
    registry.register('LineItemPaymentStatus', billingSchemas.LineItemPaymentStatusSchema),
  );
  registeredSchemaMap.set(
    'FeeAdjustmentPattern',
    registry.register('FeeAdjustmentPattern', billingSchemas.FeeAdjustmentPatternSchema),
  );
  registeredSchemaMap.set(
    'FeeAdjustmentStatus',
    registry.register('FeeAdjustmentStatus', billingSchemas.FeeAdjustmentStatusSchema),
  );
  registeredSchemaMap.set(
    'RefundRequestType',
    registry.register('RefundRequestType', billingSchemas.RefundRequestTypeSchema),
  );
  registeredSchemaMap.set(
    'RefundHandling',
    registry.register('RefundHandling', billingSchemas.RefundHandlingSchema),
  );
  registeredSchemaMap.set(
    'RefundRequestStatus',
    registry.register('RefundRequestStatus', billingSchemas.RefundRequestStatusSchema),
  );
  registeredSchemaMap.set(
    'AccountingEntryType',
    registry.register('AccountingEntryType', billingSchemas.AccountingEntryTypeSchema),
  );
  registeredSchemaMap.set(
    'BillingLineItem',
    registry.register('BillingLineItem', billingSchemas.BillingLineItemSchema),
  );
  registeredSchemaMap.set(
    'FeeAdjustment',
    registry.register('FeeAdjustment', billingSchemas.FeeAdjustmentSchema),
  );
  registeredSchemaMap.set(
    'RefundLineItemRefund',
    registry.register('RefundLineItemRefund', billingSchemas.RefundLineItemRefundSchema),
  );
  registeredSchemaMap.set(
    'RefundRequest',
    registry.register('RefundRequest', billingSchemas.RefundRequestSchema),
  );
  registeredSchemaMap.set(
    'BillingRecordListItem',
    registry.register('BillingRecordListItem', billingSchemas.BillingRecordListItemSchema),
  );
  registeredSchemaMap.set(
    'BillingRecord',
    registry.register('BillingRecord', billingSchemas.BillingRecordSchema),
  );
  registeredSchemaMap.set(
    'BillingRecordDetail',
    registry.register('BillingRecordDetail', billingSchemas.BillingRecordDetailSchema),
  );
  registeredSchemaMap.set(
    'BillingSummary',
    registry.register('BillingSummary', billingSchemas.BillingSummarySchema),
  );
  registeredSchemaMap.set(
    'GetBillingRecordsQuery',
    registry.register('GetBillingRecordsQuery', billingSchemas.GetBillingRecordsQuerySchema),
  );
  registeredSchemaMap.set(
    'GetBillingRecordsResponse',
    registry.register('GetBillingRecordsResponse', billingSchemas.GetBillingRecordsResponseSchema),
  );
  registeredSchemaMap.set(
    'GetBillingRecordsSummaryQuery',
    registry.register(
      'GetBillingRecordsSummaryQuery',
      billingSchemas.GetBillingRecordsSummaryQuerySchema,
    ),
  );
  registeredSchemaMap.set(
    'GetBillingRecordDetailResponse',
    registry.register(
      'GetBillingRecordDetailResponse',
      billingSchemas.GetBillingRecordDetailResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'ConfirmBillingRecordsRequest',
    registry.register(
      'ConfirmBillingRecordsRequest',
      billingSchemas.ConfirmBillingRecordsRequestSchema,
    ),
  );
  registeredSchemaMap.set(
    'ConfirmBillingRecordsResponse',
    registry.register(
      'ConfirmBillingRecordsResponse',
      billingSchemas.ConfirmBillingRecordsResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'ToggleConfirmationRequest',
    registry.register('ToggleConfirmationRequest', billingSchemas.ToggleConfirmationRequestSchema),
  );
  registeredSchemaMap.set(
    'AddLineItemRequest',
    registry.register('AddLineItemRequest', billingSchemas.AddLineItemRequestSchema),
  );
  registeredSchemaMap.set(
    'ApplyFeeAdjustmentRequest',
    registry.register('ApplyFeeAdjustmentRequest', billingSchemas.ApplyFeeAdjustmentRequestSchema),
  );
  registeredSchemaMap.set(
    'SubmitRefundRequest',
    registry.register('SubmitRefundRequest', billingSchemas.SubmitRefundRequestSchema),
  );
  registeredSchemaMap.set(
    'SubmitBulkRefundRequest',
    registry.register('SubmitBulkRefundRequest', billingSchemas.SubmitBulkRefundRequestSchema),
  );
  registeredSchemaMap.set(
    'SubmitBulkRefundResponse',
    registry.register('SubmitBulkRefundResponse', billingSchemas.SubmitBulkRefundResponseSchema),
  );
  registeredSchemaMap.set(
    'ManualBillingRegistrationRequest',
    registry.register(
      'ManualBillingRegistrationRequest',
      billingSchemas.ManualBillingRegistrationRequestSchema,
    ),
  );
  registeredSchemaMap.set(
    'ManualBillingRegistrationResponse',
    registry.register(
      'ManualBillingRegistrationResponse',
      billingSchemas.ManualBillingRegistrationResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'ExportBillingRecordsRequest',
    registry.register(
      'ExportBillingRecordsRequest',
      billingSchemas.ExportBillingRecordsRequestSchema,
    ),
  );
  registeredSchemaMap.set(
    'StoreMemberOption',
    registry.register('StoreMemberOption', billingSchemas.StoreMemberOptionSchema),
  );
  registeredSchemaMap.set(
    'StoreMembersResponse',
    registry.register('StoreMembersResponse', billingSchemas.StoreMembersResponseSchema),
  );

  // Register billing schemas — F-01-01/02/03 (Transaction ledger / Receivables / Refund approval)
  registeredSchemaMap.set(
    'ReceivableStatus',
    registry.register('ReceivableStatus', billingSchemas.ReceivableStatusSchema),
  );
  registeredSchemaMap.set(
    'RefundRequesterRole',
    registry.register('RefundRequesterRole', billingSchemas.RefundRequesterRoleSchema),
  );
  registeredSchemaMap.set(
    'RefundApproverRole',
    registry.register('RefundApproverRole', billingSchemas.RefundApproverRoleSchema),
  );
  registeredSchemaMap.set(
    'TransactionType',
    registry.register('TransactionType', billingSchemas.TransactionTypeSchema),
  );
  registeredSchemaMap.set(
    'TransactionStatus',
    registry.register('TransactionStatus', billingSchemas.TransactionStatusSchema),
  );
  registeredSchemaMap.set(
    'UnpaidContractType',
    registry.register('UnpaidContractType', billingSchemas.UnpaidContractTypeSchema),
  );
  registeredSchemaMap.set(
    'UpcomingBillingType',
    registry.register('UpcomingBillingType', billingSchemas.UpcomingBillingTypeSchema),
  );
  registeredSchemaMap.set(
    'RefundQueueStatus',
    registry.register('RefundQueueStatus', billingSchemas.RefundQueueStatusSchema),
  );
  registeredSchemaMap.set(
    'BadDebtExclusionAction',
    registry.register('BadDebtExclusionAction', billingSchemas.BadDebtExclusionActionSchema),
  );
  registeredSchemaMap.set(
    'RefundDecision',
    registry.register('RefundDecision', billingSchemas.RefundDecisionSchema),
  );
  registeredSchemaMap.set(
    'TransactionRecord',
    registry.register('TransactionRecord', billingSchemas.TransactionRecordSchema),
  );
  registeredSchemaMap.set(
    'GetTransactionLedgerQuery',
    registry.register('GetTransactionLedgerQuery', billingSchemas.GetTransactionLedgerQuerySchema),
  );
  registeredSchemaMap.set(
    'GetTransactionLedgerResponse',
    registry.register(
      'GetTransactionLedgerResponse',
      billingSchemas.GetTransactionLedgerResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'ExportTransactionLedgerRequest',
    registry.register(
      'ExportTransactionLedgerRequest',
      billingSchemas.ExportTransactionLedgerRequestSchema,
    ),
  );
  registeredSchemaMap.set(
    'UnpaidLineItem',
    registry.register('UnpaidLineItem', billingSchemas.UnpaidLineItemSchema),
  );
  registeredSchemaMap.set(
    'UnpaidReceivable',
    registry.register('UnpaidReceivable', billingSchemas.UnpaidReceivableSchema),
  );
  registeredSchemaMap.set(
    'GetUnpaidReceivablesQuery',
    registry.register('GetUnpaidReceivablesQuery', billingSchemas.GetUnpaidReceivablesQuerySchema),
  );
  registeredSchemaMap.set(
    'GetUnpaidReceivablesResponse',
    registry.register(
      'GetUnpaidReceivablesResponse',
      billingSchemas.GetUnpaidReceivablesResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'GetUnpaidDetailResponse',
    registry.register('GetUnpaidDetailResponse', billingSchemas.GetUnpaidDetailResponseSchema),
  );
  registeredSchemaMap.set(
    'IssueConveniencePaymentRequest',
    registry.register(
      'IssueConveniencePaymentRequest',
      billingSchemas.IssueConveniencePaymentRequestSchema,
    ),
  );
  registeredSchemaMap.set(
    'IssueConveniencePaymentResponse',
    registry.register(
      'IssueConveniencePaymentResponse',
      billingSchemas.IssueConveniencePaymentResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'BadDebtExclusionRequest',
    registry.register('BadDebtExclusionRequest', billingSchemas.BadDebtExclusionRequestSchema),
  );
  registeredSchemaMap.set(
    'BadDebtExclusionResponse',
    registry.register('BadDebtExclusionResponse', billingSchemas.BadDebtExclusionResponseSchema),
  );
  registeredSchemaMap.set(
    'UpcomingBillingEntry',
    registry.register('UpcomingBillingEntry', billingSchemas.UpcomingBillingEntrySchema),
  );
  registeredSchemaMap.set(
    'UpcomingBillingSummary',
    registry.register('UpcomingBillingSummary', billingSchemas.UpcomingBillingSummarySchema),
  );
  registeredSchemaMap.set(
    'GetUpcomingBillingQuery',
    registry.register('GetUpcomingBillingQuery', billingSchemas.GetUpcomingBillingQuerySchema),
  );
  registeredSchemaMap.set(
    'GetUpcomingBillingResponse',
    registry.register(
      'GetUpcomingBillingResponse',
      billingSchemas.GetUpcomingBillingResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'RefundQueueEntry',
    registry.register('RefundQueueEntry', billingSchemas.RefundQueueEntrySchema),
  );
  registeredSchemaMap.set(
    'GetRefundQueueQuery',
    registry.register('GetRefundQueueQuery', billingSchemas.GetRefundQueueQuerySchema),
  );
  registeredSchemaMap.set(
    'PendingRefundSummary',
    registry.register('PendingRefundSummary', billingSchemas.PendingRefundSummarySchema),
  );
  registeredSchemaMap.set(
    'GetRefundQueueResponse',
    registry.register('GetRefundQueueResponse', billingSchemas.GetRefundQueueResponseSchema),
  );
  registeredSchemaMap.set(
    'RefundDecisionRequest',
    registry.register('RefundDecisionRequest', billingSchemas.RefundDecisionRequestSchema),
  );
  registeredSchemaMap.set(
    'BulkRefundDecisionRequest',
    registry.register('BulkRefundDecisionRequest', billingSchemas.BulkRefundDecisionRequestSchema),
  );
  registeredSchemaMap.set(
    'BulkRefundDecisionResponse',
    registry.register(
      'BulkRefundDecisionResponse',
      billingSchemas.BulkRefundDecisionResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'ExportRefundQueueRequest',
    registry.register('ExportRefundQueueRequest', billingSchemas.ExportRefundQueueRequestSchema),
  );

  // ─── Routine (Y-09) ──────────────────────────────────────────────────────
  registeredSchemaMap.set(
    'RoutineCategory',
    registry.register('RoutineCategory', routineCategorySchemas.RoutineCategorySchema),
  );
  registeredSchemaMap.set(
    'GetRoutineCategoriesResponse',
    registry.register(
      'GetRoutineCategoriesResponse',
      routineCategorySchemas.GetRoutineCategoriesResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'RoutinePublishStatus',
    registry.register('RoutinePublishStatus', routineSchemas.RoutinePublishStatusSchema),
  );
  registeredSchemaMap.set(
    'RoutineBrand',
    registry.register('RoutineBrand', routineSchemas.RoutineBrandSchema),
  );
  registeredSchemaMap.set(
    'RoutineSetType',
    registry.register('RoutineSetType', routineSchemas.RoutineSetTypeSchema),
  );
  registeredSchemaMap.set(
    'RoutineSet',
    registry.register('RoutineSet', routineSchemas.RoutineSetSchema),
  );
  registeredSchemaMap.set(
    'RoutineExercise',
    registry.register('RoutineExercise', routineSchemas.RoutineExerciseSchema),
  );
  registeredSchemaMap.set(
    'RoutineListItem',
    registry.register('RoutineListItem', routineSchemas.RoutineListItemSchema),
  );
  registeredSchemaMap.set(
    'RoutinePagination',
    registry.register('RoutinePagination', routineSchemas.RoutinePaginationSchema),
  );
  registeredSchemaMap.set(
    'GetRoutinesQuery',
    registry.register('GetRoutinesQuery', routineSchemas.GetRoutinesQuerySchema),
  );
  registeredSchemaMap.set(
    'GetRoutinesResponse',
    registry.register('GetRoutinesResponse', routineSchemas.GetRoutinesResponseSchema),
  );
  registeredSchemaMap.set(
    'RoutineDetail',
    registry.register('RoutineDetail', routineSchemas.RoutineDetailSchema),
  );
  registeredSchemaMap.set(
    'UpsertRoutineSetInput',
    registry.register('UpsertRoutineSetInput', routineSchemas.UpsertRoutineSetInputSchema),
  );
  registeredSchemaMap.set(
    'UpsertRoutineExerciseInput',
    registry.register(
      'UpsertRoutineExerciseInput',
      routineSchemas.UpsertRoutineExerciseInputSchema,
    ),
  );
  registeredSchemaMap.set(
    'UpsertRoutineBody',
    registry.register('UpsertRoutineBody', routineSchemas.UpsertRoutineBodySchema),
  );
  registeredSchemaMap.set(
    'CreateRoutineResponse',
    registry.register('CreateRoutineResponse', routineSchemas.CreateRoutineResponseSchema),
  );
  registeredSchemaMap.set(
    'UpdateRoutineResponse',
    registry.register('UpdateRoutineResponse', routineSchemas.UpdateRoutineResponseSchema),
  );
  registeredSchemaMap.set(
    'GetRoutineDetailResponse',
    registry.register('GetRoutineDetailResponse', routineSchemas.GetRoutineDetailResponseSchema),
  );
  registeredSchemaMap.set(
    'UpdateRoutinePublishStatusBody',
    registry.register(
      'UpdateRoutinePublishStatusBody',
      routineSchemas.UpdateRoutinePublishStatusBodySchema,
    ),
  );
  registeredSchemaMap.set(
    'UpdateRoutinePublishStatusResponse',
    registry.register(
      'UpdateRoutinePublishStatusResponse',
      routineSchemas.UpdateRoutinePublishStatusResponseSchema,
    ),
  );
  registeredSchemaMap.set(
    'DuplicateRoutineResponse',
    registry.register('DuplicateRoutineResponse', routineSchemas.DuplicateRoutineResponseSchema),
  );
  registeredSchemaMap.set(
    'DeleteRoutineResponse',
    registry.register('DeleteRoutineResponse', routineSchemas.DeleteRoutineResponseSchema),
  );
}
