/**
 * EasyPost MCP Server 2025 - Application Performance Monitoring (APM)
 * Comprehensive monitoring integration with DataDog, New Relic, Sentry, and custom metrics
 */

import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';
import os from 'os';

// APM Integrations
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { createLogger, format, transports } from 'winston';

// Types
interface MetricData {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp?: number;
}

interface PerformanceMetrics {
  response_time: number;
  memory_usage: number;
  cpu_usage: number;
  active_connections: number;
  requests_per_second: number;
  error_rate: number;
}

interface HealthMetrics {
  uptime: number;
  memory: NodeJS.MemoryUsage;
  cpu_load: number[];
  connections: number;
  errors: number;
  performance: PerformanceMetrics;
}

class APMManager extends EventEmitter {
  private metrics: Map<string, number> = new Map();
  private startTime: number = Date.now();
  private requestCount: number = 0;
  private errorCount: number = 0;
  private responseTimeHistory: number[] = [];
  private logger: any;
  
  constructor() {
    super();
    this.setupLogger();
    this.initializeSentry();
    this.initializeNewRelic();
    this.initializeDataDog();
    this.startMetricsCollection();
  }

  // Setup structured logging
  private setupLogger() {
    this.logger = createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json(),
        format.printf(({ timestamp, level, message, ...meta }) => {
          return JSON.stringify({
            '@timestamp': timestamp,
            level,
            message,
            service: 'easypost-mcp-server',
            version: '4.0.0',
            environment: process.env.NODE_ENV || 'development',
            ...meta,
          });
        })
      ),
      defaultMeta: {
        service: 'easypost-mcp-server',
        version: '4.0.0',
      },
      transports: [
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.simple()
          ),
        }),
        new transports.File({
          filename: 'logs/error.log',
          level: 'error',
        }),
        new transports.File({
          filename: 'logs/combined.log',
        }),
      ],
    });

    // Log unhandled errors
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled Rejection', { reason, promise });
    });
  }

  // Initialize Sentry for error tracking and performance monitoring
  private initializeSentry() {
    if (process.env.SENTRY_DSN) {
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        release: process.env.npm_package_version || '4.0.0',
        
        // Performance monitoring
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        
        integrations: [
          nodeProfilingIntegration(),
          Sentry.httpIntegration({ tracing: true }),
          Sentry.expressIntegration({ app: undefined }),
        ],
        
        beforeSend(event) {
          // Filter out known non-critical errors
          const ignoreErrors = [
            'ECONNRESET',
            'EPIPE', 
            'ETIMEDOUT',
            'Non-Error promise rejection captured',
          ];
          
          if (event.exception?.values?.[0]?.value) {
            const errorMessage = event.exception.values[0].value;
            if (ignoreErrors.some(ignore => errorMessage.includes(ignore))) {
              return null;
            }
          }
          
          return event;
        },
        
        beforeSendTransaction(event) {
          // Sample only important transactions in production
          if (process.env.NODE_ENV === 'production') {
            const url = event.request?.url || '';
            if (url.includes('/health') || url.includes('/metrics')) {
              return null; // Skip health check transactions
            }
          }
          return event;
        },
      });

      this.logger.info('Sentry APM initialized', {
        environment: process.env.NODE_ENV,
        release: process.env.npm_package_version,
      });
    }
  }

  // Initialize New Relic (if available)
  private initializeNewRelic() {
    if (process.env.NEW_RELIC_LICENSE_KEY) {
      try {
        require('newrelic');
        this.logger.info('New Relic APM initialized');
      } catch (error) {
        this.logger.warn('New Relic initialization failed', { error: (error as Error).message });
      }
    }
  }

  // Initialize DataDog APM
  private initializeDataDog() {
    if (process.env.DATADOG_API_KEY) {
      try {
        const tracer = require('dd-trace').init({
          service: process.env.APP_NAME || 'easypost-mcp-server',
          version: process.env.npm_package_version || '4.0.0',
          env: process.env.NODE_ENV || 'development',
          
          // Profiling
          profiling: true,
          runtimeMetrics: true,
          
          // Sampling
          sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
          
          // Tags
          tags: {
            'service.name': 'easypost-mcp-server',
            'service.version': '4.0.0',
            'environment': process.env.NODE_ENV || 'development',
          },
        });

        // Custom DataDog metrics
        this.setupDataDogCustomMetrics();
        
        this.logger.info('DataDog APM initialized');
      } catch (error) {
        this.logger.warn('DataDog initialization failed', { error: (error as Error).message });
      }
    }
  }

  // Setup custom DataDog metrics
  private setupDataDogCustomMetrics() {
    if (process.env.DATADOG_API_KEY) {
      try {
        const StatsD = require('node-statsd');
        const statsd = new StatsD({
          host: process.env.DATADOG_HOST || 'localhost',
          port: process.env.DATADOG_PORT || 8125,
          prefix: 'easypost.mcp.',
          tags: [`env:${process.env.NODE_ENV || 'development'}`],
        });

        // Send custom business metrics every 30 seconds
        setInterval(() => {
          this.sendDataDogMetrics(statsd);
        }, 30000);
      } catch (error) {
        this.logger.warn('DataDog StatsD setup failed', { error: (error as Error).message });
      }
    }
  }

  // Send custom metrics to DataDog
  private sendDataDogMetrics(statsd: any) {
    const metrics = this.getPerformanceMetrics();
    
    statsd.gauge('response_time', metrics.response_time);
    statsd.gauge('memory_usage', metrics.memory_usage);
    statsd.gauge('cpu_usage', metrics.cpu_usage);
    statsd.gauge('active_connections', metrics.active_connections);
    statsd.gauge('requests_per_second', metrics.requests_per_second);
    statsd.gauge('error_rate', metrics.error_rate);
    
    // Business metrics
    statsd.increment('requests.total', this.requestCount);
    statsd.increment('errors.total', this.errorCount);
  }

  // Start collecting system metrics
  private startMetricsCollection() {
    // Collect metrics every 10 seconds
    setInterval(() => {
      this.collectSystemMetrics();
      this.emit('metrics', this.getHealthMetrics());
    }, 10000);

    // Clean up old metrics every 5 minutes
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 300000);
  }

  // Collect system performance metrics
  private collectSystemMetrics() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Store metrics
    this.metrics.set('memory_heap_used', memoryUsage.heapUsed);
    this.metrics.set('memory_heap_total', memoryUsage.heapTotal);
    this.metrics.set('memory_rss', memoryUsage.rss);
    this.metrics.set('memory_external', memoryUsage.external);
    
    this.metrics.set('cpu_user', cpuUsage.user);
    this.metrics.set('cpu_system', cpuUsage.system);
    
    this.metrics.set('uptime', process.uptime());
    this.metrics.set('timestamp', Date.now());
  }

  // Clean up old metrics to prevent memory leaks
  private cleanupOldMetrics() {
    // Keep only last 100 response times
    if (this.responseTimeHistory.length > 100) {
      this.responseTimeHistory = this.responseTimeHistory.slice(-100);
    }
  }

  // Middleware to track HTTP requests
  public trackRequest() {
    return (req: any, res: any, next: any) => {
      const startTime = performance.now();
      const startCpuUsage = process.cpuUsage();
      
      // Increment request counter
      this.requestCount++;
      
      // Track response
      res.on('finish', () => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        const cpuUsed = process.cpuUsage(startCpuUsage);
        
        // Store response time
        this.responseTimeHistory.push(responseTime);
        
        // Track errors
        if (res.statusCode >= 400) {
          this.errorCount++;
        }
        
        // Log request
        this.logger.info('HTTP Request', {
          method: req.method,
          url: req.url,
          status: res.statusCode,
          response_time: Math.round(responseTime * 100) / 100,
          user_agent: req.get('User-Agent'),
          ip: req.ip,
          cpu_usage: {
            user: cpuUsed.user / 1000, // Convert to milliseconds
            system: cpuUsed.system / 1000,
          },
        });
        
        // Send to APM services
        this.trackPerformanceMetric({
          name: 'http_request_duration',
          value: responseTime,
          tags: {
            method: req.method,
            route: req.route?.path || req.path,
            status_code: res.statusCode.toString(),
          },
        });
      });
      
      next();
    };
  }

  // Track custom performance metrics
  public trackPerformanceMetric(metric: MetricData) {
    // Store locally
    this.metrics.set(metric.name, metric.value);
    
    // Send to Sentry
    if (process.env.SENTRY_DSN) {
      Sentry.metrics.gauge(metric.name, metric.value, {
        tags: metric.tags,
        timestamp: metric.timestamp || Date.now(),
      });
    }
    
    // Emit event for other listeners
    this.emit('metric', metric);
  }

  // Track business events
  public trackEvent(eventName: string, properties: Record<string, any> = {}) {
    const event = {
      event: eventName,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        service: 'easypost-mcp-server',
        version: '4.0.0',
      },
    };
    
    this.logger.info('Business Event', event);
    
    // Send to Sentry
    if (process.env.SENTRY_DSN) {
      Sentry.addBreadcrumb({
        category: 'business',
        message: eventName,
        data: properties,
        level: 'info',
      });
    }
    
    this.emit('event', event);
  }

  // Get current performance metrics
  public getPerformanceMetrics(): PerformanceMetrics {
    const avgResponseTime = this.responseTimeHistory.length > 0
      ? this.responseTimeHistory.reduce((a, b) => a + b, 0) / this.responseTimeHistory.length
      : 0;
      
    const memoryUsage = process.memoryUsage();
    const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    
    const uptime = process.uptime();
    const requestsPerSecond = uptime > 0 ? this.requestCount / uptime : 0;
    const errorRate = this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0;
    
    return {
      response_time: Math.round(avgResponseTime * 100) / 100,
      memory_usage: Math.round(memoryUsagePercent * 100) / 100,
      cpu_usage: this.getCpuUsagePercent(),
      active_connections: this.metrics.get('active_connections') || 0,
      requests_per_second: Math.round(requestsPerSecond * 100) / 100,
      error_rate: Math.round(errorRate * 100) / 100,
    };
  }

  // Get comprehensive health metrics
  public getHealthMetrics(): HealthMetrics {
    return {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu_load: os.loadavg(),
      connections: this.metrics.get('active_connections') || 0,
      errors: this.errorCount,
      performance: this.getPerformanceMetrics(),
    };
  }

  // Calculate CPU usage percentage
  private getCpuUsagePercent(): number {
    const cpuUser = this.metrics.get('cpu_user') || 0;
    const cpuSystem = this.metrics.get('cpu_system') || 0;
    const totalCpu = cpuUser + cpuSystem;
    
    // Convert microseconds to percentage (rough approximation)
    return Math.round((totalCpu / 1000000) * 100) / 100;
  }

  // Track EasyPost-specific business metrics
  public trackShipmentCreated(shipmentData: any) {
    this.trackEvent('shipment_created', {
      carrier: shipmentData.selected_rate?.carrier,
      service: shipmentData.selected_rate?.service,
      cost: shipmentData.selected_rate?.rate,
      ai_selected: shipmentData.ai_selected || false,
    });
    
    this.trackPerformanceMetric({
      name: 'shipments_created_total',
      value: 1,
      tags: {
        carrier: shipmentData.selected_rate?.carrier || 'unknown',
        service: shipmentData.selected_rate?.service || 'unknown',
      },
    });
  }

  // Track Luma AI usage
  public trackLumaRecommendation(recommendationData: any) {
    this.trackEvent('luma_recommendation_generated', {
      confidence: recommendationData.confidence_score,
      recommendations_count: recommendationData.recommendations?.length || 0,
      processing_time: recommendationData.processing_time_ms,
    });
    
    this.trackPerformanceMetric({
      name: 'luma_processing_time',
      value: recommendationData.processing_time_ms || 0,
      tags: {
        confidence_level: recommendationData.confidence || 'unknown',
      },
    });
  }

  // Track claims processing
  public trackClaimSubmitted(claimData: any) {
    this.trackEvent('claim_submitted', {
      type: claimData.type,
      amount: claimData.claimed_amount,
      ai_analysis: claimData.ai_analysis || false,
    });
    
    this.trackPerformanceMetric({
      name: 'claims_submitted_total',
      value: 1,
      tags: {
        type: claimData.type,
        ai_enabled: claimData.ai_analysis ? 'true' : 'false',
      },
    });
  }

  // Create Prometheus metrics endpoint
  public getPrometheusMetrics(): string {
    const metrics = this.getPerformanceMetrics();
    const health = this.getHealthMetrics();
    
    return `
# HELP easypost_response_time_seconds Average response time in seconds
# TYPE easypost_response_time_seconds gauge
easypost_response_time_seconds ${metrics.response_time / 1000}

# HELP easypost_memory_usage_percent Memory usage percentage
# TYPE easypost_memory_usage_percent gauge
easypost_memory_usage_percent ${metrics.memory_usage}

# HELP easypost_cpu_usage_percent CPU usage percentage
# TYPE easypost_cpu_usage_percent gauge
easypost_cpu_usage_percent ${metrics.cpu_usage}

# HELP easypost_requests_per_second Requests per second
# TYPE easypost_requests_per_second gauge
easypost_requests_per_second ${metrics.requests_per_second}

# HELP easypost_error_rate_percent Error rate percentage
# TYPE easypost_error_rate_percent gauge
easypost_error_rate_percent ${metrics.error_rate}

# HELP easypost_uptime_seconds Process uptime in seconds
# TYPE easypost_uptime_seconds counter
easypost_uptime_seconds ${health.uptime}

# HELP easypost_memory_heap_used_bytes Heap memory used in bytes
# TYPE easypost_memory_heap_used_bytes gauge
easypost_memory_heap_used_bytes ${health.memory.heapUsed}

# HELP easypost_requests_total Total number of HTTP requests
# TYPE easypost_requests_total counter
easypost_requests_total ${this.requestCount}

# HELP easypost_errors_total Total number of errors
# TYPE easypost_errors_total counter
easypost_errors_total ${this.errorCount}
`.trim();
  }
}

// Create singleton instance
export const apmManager = new APMManager();

// Express middleware factory
export const createAPMMiddleware = () => {
  return apmManager.trackRequest();
};

// Helper functions for easy tracking
export const trackShipment = (data: any) => apmManager.trackShipmentCreated(data);
export const trackLuma = (data: any) => apmManager.trackLumaRecommendation(data);
export const trackClaim = (data: any) => apmManager.trackClaimSubmitted(data);
export const trackMetric = (name: string, value: number, tags?: Record<string, string>) => {
  apmManager.trackPerformanceMetric({ name, value, tags });
};

// Export types
export type { MetricData, PerformanceMetrics, HealthMetrics };

export default apmManager;