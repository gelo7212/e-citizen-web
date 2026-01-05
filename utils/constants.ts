/**
 * Status constants for reports and SOS
 */

export const REPORT_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in-progress',
  RESOLVED: 'resolved',
  ARCHIVED: 'archived',
} as const;

export const SOS_STATUS = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  EN_ROUTE: 'en-route',
  ARRIVED: 'arrived',
  ASSISTING: 'assisting',
  DONE: 'done',
} as const;

export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export const ANNOUNCEMENT_CATEGORIES = {
  NEWS: 'news',
  ALERT: 'alert',
  ADVISORY: 'advisory',
} as const;

export const ASSISTANCE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
} as const;

/**
 * Role constants
 */

export const ROLES = {
  APP_ADMIN: 'app_admin',
  CITY_ADMIN: 'city_admin',
  SOS_ADMIN: 'sos_admin',
  SK_ADMIN: 'sk_admin',
  RESCUER: 'rescuer',
  CITIZEN: 'citizen',
} as const;

/**
 * Error messages
 */

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please try again.',
  UNAUTHORIZED: 'Unauthorized access.',
  FORBIDDEN: 'You do not have permission.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Invalid input data.',
  SERVER_ERROR: 'Server error. Please try again later.',
} as const;

/**
 * Success messages
 */

export const SUCCESS_MESSAGES = {
  CREATED: 'Created successfully.',
  UPDATED: 'Updated successfully.',
  DELETED: 'Deleted successfully.',
  SAVED: 'Saved successfully.',
} as const;
