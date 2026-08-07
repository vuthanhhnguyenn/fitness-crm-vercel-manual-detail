import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

/**
 * Notification Settings Schema
 */
export const NotificationSettingsSchema = z
  .object({
    notify_on_high_risk: z.boolean().openapi({
      example: true,
      description: 'Notify on high risk applications',
    }),
    notify_on_blacklist_match: z.boolean().openapi({
      example: true,
      description: 'Notify on blacklist match',
    }),
    notify_on_duplicate: z.boolean().openapi({
      example: true,
      description: 'Notify on duplicate applications',
    }),
    email_recipients: z.array(z.string().email()).openapi({
      example: ['admin@example.com'],
      description: 'Email recipients for notifications',
    }),
  })
  .openapi({
    title: 'NotificationSettings',
    description: 'Notification settings for auto-approval',
  });

/**
 * Auto Approval Settings Schema
 */
export const AutoApprovalSettingsSchema = z
  .object({
    enabled: z.boolean().openapi({
      example: true,
      description: 'Whether auto-approval is enabled',
    }),
    risk_score_threshold: z.number().min(0).max(100).openapi({
      example: 70,
      description: 'Risk score threshold (0-100)',
    }),
    auto_approve_below_threshold: z.boolean().openapi({
      example: true,
      description: 'Auto approve applications below threshold',
    }),
    require_manual_review_above_threshold: z.boolean().openapi({
      example: true,
      description: 'Require manual review for applications above threshold',
    }),
    blacklist_check_enabled: z.boolean().openapi({
      example: true,
      description: 'Enable blacklist check',
    }),
    duplicate_check_enabled: z.boolean().openapi({
      example: true,
      description: 'Enable duplicate check',
    }),
    payment_verification_required: z.boolean().openapi({
      example: true,
      description: 'Require payment verification',
    }),
    document_verification_required: z.boolean().openapi({
      example: true,
      description: 'Require document verification',
    }),
    notification_settings: NotificationSettingsSchema.openapi({
      description: 'Notification settings',
    }),
    updated_at: z.string().datetime().openapi({
      example: '2024-01-15T12:30:00Z',
      description: 'Last update timestamp',
    }),
    updated_by: z.string().openapi({
      example: 'admin-001',
      description: 'User who last updated the settings',
    }),
  })
  .openapi({
    title: 'AutoApprovalSettings',
    description: 'Auto-approval settings configuration',
  });

/**
 * Get Settings Response Schema
 */
export const GetSettingsResponseSchema = z
  .object({
    settings: AutoApprovalSettingsSchema.openapi({
      description: 'Auto-approval settings',
    }),
  })
  .openapi({
    title: 'GetSettingsResponse',
    description: 'Response for getting auto-approval settings',
  });

/**
 * Update Settings Request Schema
 */
export const UpdateSettingsRequestSchema = AutoApprovalSettingsSchema.partial()
  .extend({
    enabled: z.boolean().openapi({
      example: true,
      description: 'Whether auto-approval is enabled',
    }),
  })
  .openapi({
    title: 'UpdateSettingsRequest',
    description: 'Request payload for updating auto-approval settings',
  });

/**
 * Update Settings Response Schema
 */
export const UpdateSettingsResponseSchema = z
  .object({
    success: z.boolean().openapi({
      example: true,
      description: 'Whether the update was successful',
    }),
    settings: AutoApprovalSettingsSchema.openapi({
      description: 'Updated settings',
    }),
  })
  .openapi({
    title: 'UpdateSettingsResponse',
    description: 'Response for updating auto-approval settings',
  });

/**
 * Get Dashboard Query Schema
 */
export const GetDashboardQuerySchema = z
  .object({
    period: z.enum(['day', 'week', 'month']).optional().default('month').openapi({
      example: 'month',
      description: 'Time period',
    }),
  })
  .openapi({
    title: 'GetDashboardQuery',
    description: 'Query parameters for getting dashboard',
  });

/**
 * Date Range Schema
 */
export const DateRangeSchema = z
  .object({
    start: z.string().datetime().openapi({
      example: '2024-01-01T00:00:00Z',
      description: 'Start date',
    }),
    end: z.string().datetime().openapi({
      example: '2024-01-31T23:59:59Z',
      description: 'End date',
    }),
  })
  .openapi({
    title: 'DateRange',
    description: 'Date range',
  });

/**
 * Statistics Schema
 */
export const DashboardStatisticsSchema = z
  .object({
    total_applications: z.number().openapi({
      example: 1234,
      description: 'Total number of applications',
    }),
    auto_approved: z.number().openapi({
      example: 1018,
      description: 'Number of auto-approved applications',
    }),
    manual_approved: z.number().openapi({
      example: 195,
      description: 'Number of manually approved applications',
    }),
    rejected: z.number().openapi({
      example: 21,
      description: 'Number of rejected applications',
    }),
    auto_approval_rate: z.number().openapi({
      example: 82.5,
      description: 'Auto approval rate (%)',
    }),
    average_processing_time_minutes: z.number().openapi({
      example: 83,
      description: 'Average processing time in minutes',
    }),
    average_risk_score: z.number().openapi({
      example: 45.2,
      description: 'Average risk score',
    }),
  })
  .openapi({
    title: 'DashboardStatistics',
    description: 'Dashboard statistics',
  });

/**
 * Risk Distribution Schema
 */
export const RiskDistributionSchema = z
  .object({
    low_risk: z.number().openapi({
      example: 850,
      description: 'Number of low risk applications (risk_score < 30)',
    }),
    medium_risk: z.number().openapi({
      example: 300,
      description: 'Number of medium risk applications (30 <= risk_score < 70)',
    }),
    high_risk: z.number().openapi({
      example: 84,
      description: 'Number of high risk applications (risk_score >= 70)',
    }),
  })
  .openapi({
    title: 'RiskDistribution',
    description: 'Risk distribution',
  });

/**
 * Rejection Reasons Schema
 */
export const RejectionReasonsSchema = z
  .object({
    blacklist_match: z.number().openapi({
      example: 5,
      description: 'Blacklist match count',
    }),
    duplicate_application: z.number().openapi({
      example: 8,
      description: 'Duplicate application count',
    }),
    payment_failure: z.number().openapi({
      example: 3,
      description: 'Payment failure count',
    }),
    high_risk_score: z.number().openapi({
      example: 4,
      description: 'High risk score count',
    }),
    document_issue: z.number().openapi({
      example: 1,
      description: 'Document issue count',
    }),
    other: z.number().openapi({
      example: 0,
      description: 'Other reasons count',
    }),
  })
  .openapi({
    title: 'RejectionReasons',
    description: 'Rejection reasons breakdown',
  });

/**
 * Daily Trend Schema
 */
export const DailyTrendSchema = z
  .object({
    date: z.string().date().openapi({
      example: '2024-01-15',
      description: 'Date',
    }),
    total: z.number().openapi({
      example: 45,
      description: 'Total applications',
    }),
    auto_approved: z.number().openapi({
      example: 35,
      description: 'Auto-approved applications',
    }),
    manual_approved: z.number().openapi({
      example: 8,
      description: 'Manually approved applications',
    }),
    rejected: z.number().openapi({
      example: 2,
      description: 'Rejected applications',
    }),
  })
  .openapi({
    title: 'DailyTrend',
    description: 'Daily trend data',
  });

/**
 * Recent Activity Schema
 */
export const RecentActivitySchema = z
  .object({
    id: z.string().openapi({
      example: 'ACT-001',
      description: 'Activity ID',
    }),
    type: z.enum(['auto_approved', 'manual_approved', 'rejected']).openapi({
      example: 'auto_approved',
      description: 'Activity type',
    }),
    application_id: z.string().openapi({
      example: 'APP-00123',
      description: 'Application ID',
    }),
    applicant_name: z.string().openapi({
      example: '山田太郎',
      description: 'Applicant name',
    }),
    risk_score: z.number().openapi({
      example: 45,
      description: 'Risk score',
    }),
    timestamp: z.string().datetime().openapi({
      example: '2024-01-15T12:30:00Z',
      description: 'Activity timestamp',
    }),
    approved_by: z.string().optional().openapi({
      example: 'staff-001',
      description: 'Staff ID who approved (for manual approval)',
    }),
    rejected_by: z.string().optional().openapi({
      example: 'staff-002',
      description: 'Staff ID who rejected (for rejection)',
    }),
    rejection_reason: z.string().optional().openapi({
      example: 'ブラックリスト一致',
      description: 'Rejection reason (for rejection)',
    }),
  })
  .openapi({
    title: 'RecentActivity',
    description: 'Recent activity information',
  });

/**
 * Dashboard Schema
 */
export const DashboardSchema = z
  .object({
    period: z.enum(['day', 'week', 'month']).openapi({
      example: 'month',
      description: 'Time period',
    }),
    date_range: DateRangeSchema.openapi({
      description: 'Date range',
    }),
    statistics: DashboardStatisticsSchema.openapi({
      description: 'Statistics',
    }),
    risk_distribution: RiskDistributionSchema.openapi({
      description: 'Risk distribution',
    }),
    rejection_reasons: RejectionReasonsSchema.openapi({
      description: 'Rejection reasons',
    }),
    daily_trends: z.array(DailyTrendSchema).openapi({
      description: 'Daily trends',
    }),
    recent_activities: z.array(RecentActivitySchema).openapi({
      description: 'Recent activities',
    }),
  })
  .openapi({
    title: 'Dashboard',
    description: 'Auto-approval dashboard data',
  });

/**
 * Get Dashboard Response Schema
 */
export const GetDashboardResponseSchema = z
  .object({
    dashboard: DashboardSchema.openapi({
      description: 'Dashboard data',
    }),
  })
  .openapi({
    title: 'GetDashboardResponse',
    description: 'Response for getting dashboard',
  });

/**
 * Error Response Schema
 */
export const ErrorResponseSchema = z
  .object({
    error: z.string().openapi({
      example: 'Failed to process request',
      description: 'Error message',
    }),
  })
  .openapi({
    title: 'ErrorResponse',
    description: 'Error response',
  });

// Type exports for use in route handlers
export type NotificationSettings = z.infer<typeof NotificationSettingsSchema>;
export type AutoApprovalSettings = z.infer<typeof AutoApprovalSettingsSchema>;
export type GetSettingsResponse = z.infer<typeof GetSettingsResponseSchema>;
export type UpdateSettingsRequest = z.infer<typeof UpdateSettingsRequestSchema>;
export type UpdateSettingsResponse = z.infer<typeof UpdateSettingsResponseSchema>;
export type GetDashboardQuery = z.infer<typeof GetDashboardQuerySchema>;
export type GetDashboardResponse = z.infer<typeof GetDashboardResponseSchema>;
export type Dashboard = z.infer<typeof DashboardSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
