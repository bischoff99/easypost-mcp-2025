/**
 * EasyPost MCP Server 2025 - TypeScript Type Definitions
 * Comprehensive type safety for modern shipping platform
 */

import { Request, Response, NextFunction } from 'express';
import { WebSocket } from 'ws';

// === Core EasyPost Types ===

export interface Address {
  id?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  name?: string;
  company?: string;
  phone?: string;
  email?: string;
  residential?: boolean;
  verified?: boolean;
  verifications?: AddressVerifications;
}

export interface AddressVerifications {
  delivery?: {
    success: boolean;
    errors: string[];
    details?: Record<string, any>;
  };
  zip4?: {
    success: boolean;
    zip4?: string;
  };
}

export interface Parcel {
  id?: string;
  length: number;
  width: number;
  height: number;
  weight: number;
  predefined_package?: string;
}

export interface Rate {
  id: string;
  service: string;
  carrier: string;
  rate: string;
  currency: string;
  retail_rate?: string;
  list_rate?: string;
  delivery_days?: number;
  delivery_date?: string;
  delivery_date_guaranteed?: boolean;
  est_delivery_days?: number;
  billing_type?: 'account' | 'wallet';
  carbon_offset?: string;
  carrier_account_id?: string;
  rate_error?: string;
  // 2025 Enhanced fields
  ai_score?: number;
  sustainability_rating?: 'A' | 'B' | 'C' | 'D' | 'F';
  reliability_score?: number;
}

export interface Shipment {
  id: string;
  status: 'created' | 'purchased' | 'cancelled' | 'delivered' | 'returned';
  tracking_code?: string;
  from_address: Address;
  to_address: Address;
  parcel: Parcel;
  rates: Rate[];
  selected_rate?: Rate;
  postage_label?: PostageLabel;
  options?: ShipmentOptions;
  customs_info?: CustomsInfo;
  created_at: string;
  updated_at: string;
}

export interface PostageLabel {
  id: string;
  label_url: string;
  label_pdf_url: string;
  label_zpl_url?: string;
  label_epl2_url?: string;
  label_file_type: 'image/png' | 'application/pdf' | 'text/plain';
  label_size: string;
  label_type: string;
}

export interface ShipmentOptions {
  label_date?: string;
  label_format?: 'PDF' | 'PNG' | 'ZPL' | 'EPL2';
  insurance?: string;
  delivery_confirmation?: string;
  signature_confirmation?: string;
  certified_mail?: boolean;
  registered_mail?: boolean;
  return_receipt?: boolean;
  carbon_neutral?: boolean;
  hold_for_pickup?: boolean;
  // 2025 Enhanced options
  use_luma?: boolean;
  realtime_tracking?: boolean;
  auto_validate_addresses?: boolean;
  include_ai_recommendations?: boolean;
  carbon_tracking?: boolean;
}

// === Luma AI Types (2025) ===

export interface LumaRecommendation {
  carrier: string;
  service: string;
  estimated_cost: string;
  delivery_days: number;
  confidence_score: number;
  ai_reasoning: string;
  carbon_footprint: string;
  reliability_score: number;
  features: string[];
  predicted_delivery_date: string;
  risk_factors: string[];
  cost_breakdown: {
    base_rate: string;
    fuel_surcharge: string;
    insurance?: string;
    additional_fees?: string;
  };
}

export interface LumaRequest {
  shipment: {
    from_address: Address;
    to_address: Address;
    parcel: Parcel;
    preferences?: {
      priority: 'cost' | 'speed' | 'reliability' | 'carbon';
      max_delivery_days?: number;
      max_cost?: number;
      carbon_neutral?: boolean;
      signature_required?: boolean;
    };
  };
}

export interface LumaResponse {
  ai_analysis: {
    processing_time_ms: number;
    model_version: string;
    confidence: 'high' | 'medium' | 'low';
    data_points_analyzed: number;
    similar_shipments_found: number;
  };
  recommendations: LumaRecommendation[];
  insights: {
    best_value: LumaRecommendation;
    fastest: LumaRecommendation;
    most_reliable: LumaRecommendation;
    most_sustainable: LumaRecommendation;
  };
  market_conditions: {
    demand_level: 'low' | 'normal' | 'high';
    weather_alerts: string[];
    carrier_performance: string;
  };
}

// === Claims API Types (2025) ===

export interface Claim {
  id: string;
  type: 'damage' | 'loss' | 'theft' | 'delay' | 'other';
  status: 'submitted' | 'under_review' | 'approved' | 'denied' | 'closed';
  tracking_code: string;
  description: string;
  requested_amount: string;
  approved_amount?: string;
  contact_email: string;
  attachments?: string[];
  shipment_id?: string;
  insurance_id?: string;
  recipient_name?: string;
  created_at: string;
  updated_at: string;
  history: ClaimHistoryEntry[];
  ai_analysis?: {
    risk_assessment: 'low' | 'medium' | 'high';
    fraud_indicators: 'none_detected' | 'low_risk' | 'medium_risk' | 'high_risk';
    evidence_quality: 'poor' | 'fair' | 'good' | 'excellent';
    processing_priority: 'low' | 'standard' | 'high' | 'urgent';
    estimated_resolution_days: number;
  };
}

export interface ClaimHistoryEntry {
  id: string;
  status: string;
  datetime: string;
  message: string;
  details?: Record<string, any>;
}

// === Forge Platform Types (2025) ===

export interface ForgeCustomer {
  id: string;
  status: 'active' | 'suspended' | 'terminated';
  customer_info: {
    company_name: string;
    contact_name: string;
    email: string;
    phone: string;
    billing_address?: Address;
  };
  api_keys: {
    production: string;
    test: string;
  };
  portal_url: string;
  configuration: ForgeConfiguration;
  billing: {
    plan: string;
    monthly_limit: number;
    current_usage: number;
    billing_cycle_start: string;
    next_billing_date: string;
  };
  created_at: string;
  updated_at: string;
}

export interface ForgeConfiguration {
  branding?: {
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
    company_name?: string;
    custom_domain?: string;
  };
  features: {
    luma_ai_enabled: boolean;
    carbon_tracking: boolean;
    advanced_analytics: boolean;
    white_label_portal: boolean;
    custom_webhooks: boolean;
    priority_support: boolean;
  };
  limits: {
    monthly_shipments: number;
    api_calls_per_hour: number;
    webhook_retries: number;
    file_upload_size_mb: number;
  };
  notification_settings: {
    email_notifications: boolean;
    sms_notifications: boolean;
    webhook_notifications: boolean;
    notification_email?: string;
  };
}

// === Batch Processing Types ===

export interface Batch {
  id: string;
  status: 'created' | 'processing' | 'completed' | 'failed' | 'partially_failed';
  shipment_count: number;
  completed_count: number;
  failed_count: number;
  shipments: string[]; // shipment IDs
  created_at: string;
  updated_at: string;
  estimated_completion?: string;
  optimization_results?: {
    carrier_changes: number;
    estimated_savings: string;
    carbon_reduction: string;
  };
  errors?: BatchError[];
}

export interface BatchError {
  shipment_index: number;
  shipment_data: Record<string, any>;
  error_code: string;
  error_message: string;
  suggestions?: string[];
}

// === Analytics Types ===

export interface AnalyticsRequest {
  date_range: {
    start_date: string;
    end_date: string;
  };
  analysis_type: 'cost_optimization' | 'carrier_performance' | 'delivery_predictions' | 'carbon_impact' | 'trend_analysis';
  ai_insights?: boolean;
  grouping: 'daily' | 'weekly' | 'monthly';
  filters?: {
    carriers?: string[];
    services?: string[];
    destinations?: string[];
    cost_range?: {
      min: number;
      max: number;
    };
  };
}

export interface AnalyticsResponse {
  summary: {
    period: string;
    total_shipments: number;
    total_cost: string;
    ai_optimization_savings: string;
    carbon_footprint: string;
    average_delivery_days: number;
    on_time_percentage: number;
  };
  ai_insights: Array<{
    type: string;
    title: string;
    impact: string;
    confidence: number;
    recommendation?: string;
    data_points?: number;
  }>;
  trends: {
    cost_trend: 'increasing' | 'decreasing' | 'stable';
    volume_trend: 'increasing' | 'decreasing' | 'stable';
    efficiency_score: number;
    seasonal_patterns?: Record<string, any>;
  };
  predictions: {
    next_month_volume: number;
    next_month_cost: string;
    recommended_actions: string[];
    risk_factors?: string[];
  };
  charts: {
    monthly_volume: Array<{ month: string; count: number }>;
    carrier_breakdown: Array<{ carrier: string; percentage: number; count: number }>;
    cost_distribution: Array<{ range: string; count: number }>;
    delivery_performance: Array<{ carrier: string; on_time_rate: number }>;
  };
}

// === Tracking Types ===

export interface Tracker {
  id: string;
  tracking_code: string;
  status: 'pre_transit' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'return_to_sender' | 'failure' | 'cancelled' | 'error';
  status_detail: string;
  carrier: string;
  shipment_id?: string;
  tracking_details: TrackingDetail[];
  public_url: string;
  signed_by?: string;
  weight?: string;
  est_delivery_date?: string;
  created_at: string;
  updated_at: string;
}

export interface TrackingDetail {
  object: 'TrackingDetail';
  message: string;
  description?: string;
  status: string;
  status_detail: string;
  datetime: string;
  source: string;
  carrier_code?: string;
  tracking_location: TrackingLocation;
}

export interface TrackingLocation {
  object: 'TrackingLocation';
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
}

// === Customs Types ===

export interface CustomsInfo {
  id?: string;
  customs_certify: boolean;
  customs_signer: string;
  contents_type: 'gift' | 'merchandise' | 'documents' | 'returned_goods' | 'sample' | 'other';
  contents_explanation?: string;
  restriction_type: 'none' | 'other' | 'quarantine' | 'sanitary_phytosanitary_inspection';
  restriction_comments?: string;
  non_delivery_option: 'abandon' | 'return';
  customs_items: CustomsItem[];
  declaration?: string;
  eel_pfc?: string;
}

export interface CustomsItem {
  id?: string;
  description: string;
  quantity: number;
  weight: number;
  value: number;
  hs_tariff_number?: string;
  origin_country: string;
  currency?: string;
  eccn?: string;
}

// === API Response Types ===

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string[];
  meta?: {
    operation_id: string;
    duration_ms: number;
    timestamp: string;
    api_version: string;
  };
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    count: number;
    offset: number;
    limit: number;
    has_more: boolean;
  };
}

// === Express Middleware Types ===

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'admin' | 'user' | 'readonly';
    permissions: string[];
  };
  api_key?: string;
}

export interface ValidatedRequest<T = any> extends Request {
  validatedData: T;
}

export type AsyncRequestHandler<T = AuthenticatedRequest> = (
  req: T,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

// === WebSocket Types ===

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
  id: string;
}

export interface ClientConnection {
  id: string;
  socket: WebSocket;
  subscriptions: Set<string>;
  authenticated: boolean;
  user_id?: string;
  connected_at: string;
  last_activity: string;
}

// === Configuration Types ===

export interface ServerConfig {
  port: number;
  host: string;
  environment: 'development' | 'staging' | 'production';
  cors: {
    origin: string | string[];
    methods: string[];
    credentials: boolean;
  };
  rate_limit: {
    window_ms: number;
    max_requests: number;
    skip_successful: boolean;
  };
  security: {
    helmet_options: Record<string, any>;
    jwt_secret: string;
    api_key_header: string;
    webhook_secret?: string;
  };
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug';
    file_enabled: boolean;
    console_enabled: boolean;
  };
  cache: {
    enabled: boolean;
    ttl: number;
    redis_url?: string;
  };
  monitoring: {
    apm_enabled: boolean;
    metrics_enabled: boolean;
    health_check_path: string;
  };
}

export interface EasyPostConfig {
  api_key: string;
  timeout: number;
  max_retries: number;
  base_url?: string;
  luma_enabled: boolean;
  forge_enabled: boolean;
  webhook_secret?: string;
}

// === Error Types ===

export class EasyPostError extends Error {
  constructor(
    message: string,
    public code: string,
    public details: Record<string, any> = {},
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'EasyPostError';
  }
}

export class ValidationError extends EasyPostError {
  constructor(message: string, details: Record<string, any> = {}) {
    super(message, 'VALIDATION_ERROR', details, 400);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends EasyPostError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTHENTICATION_ERROR', {}, 401);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends EasyPostError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT_ERROR', {}, 429);
    this.name = 'RateLimitError';
  }
}

// === Utility Types ===

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

// === Event Types ===

export interface WebhookEvent {
  id: string;
  created_at: string;
  updated_at: string;
  description: string;
  mode: 'test' | 'production';
  previous_attributes: Record<string, any>;
  pending_urls: Array<{
    url: string;
    next_attempt_at: string;
  }>;
  completed_urls: Array<{
    url: string;
    completed_at: string;
    response_code: number;
  }>;
}

export interface ShipmentEvent extends WebhookEvent {
  event_type: 'shipment.purchased' | 'shipment.cancelled' | 'shipment.delivered' | 'shipment.returned';
  object: Shipment;
}

export interface TrackerEvent extends WebhookEvent {
  event_type: 'tracker.updated' | 'tracker.delivered';
  object: Tracker;
}

export interface BatchEvent extends WebhookEvent {
  event_type: 'batch.created' | 'batch.processing' | 'batch.completed' | 'batch.failed';
  object: Batch;
}

// === Testing Types ===

export interface TestContext {
  server: any;
  client: any;
  cleanup: () => Promise<void>;
}

export interface TestConfig {
  api_key: string;
  base_url: string;
  timeout: number;
}

// === Internationalization Types ===

export interface I18nConfig {
  defaultLocale: string;
  supportedLocales: string[];
  fallbackLocale: string;
  directory: string;
  updateFiles: boolean;
}

export interface LocalizedString {
  [locale: string]: string;
}

export interface TranslationResource {
  [key: string]: string | TranslationResource;
}

// === Monitoring Types ===

export interface PerformanceMetrics {
  response_time_ms: number;
  memory_usage_mb: number;
  cpu_usage_percent: number;
  active_connections: number;
  requests_per_second: number;
  error_rate_percent: number;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    [service: string]: {
      status: 'pass' | 'fail' | 'warn';
      message?: string;
      duration_ms?: number;
      observed_value?: any;
      observed_unit?: string;
      threshold?: any;
    };
  };
  timestamp: string;
  uptime_seconds: number;
  version: string;
}

// Export all types for easy importing
export * from './server.types';
export * from './client.types';