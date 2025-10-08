/**
 * OpenAPI 3.1 Specification for EasyPost MCP Server 2025
 * Complete API documentation with examples and TypeScript integration
 */

export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'EasyPost MCP Server API',
    description: `
# EasyPost MCP Server 2025 API

AI-powered shipping and logistics platform with comprehensive features:

- 🤖 **Luma AI Integration**: Smart shipping recommendations
- 🔧 **Forge Platform**: White-label customer management  
- 🛡️ **Claims API**: Automated insurance claim processing
- ⚡ **Real-time Updates**: WebSocket-powered notifications
- 🌐 **Modern Architecture**: Express 5.x with TypeScript

## Authentication

All API endpoints require authentication via API key:

\`\`\`
X-API-Key: your_api_key_here
\`\`\`

## Rate Limiting

- **Standard**: 1000 requests per 15 minutes
- **Burst**: 100 requests per minute
- **WebSocket**: 10 connections per API key

## Error Handling

All errors follow RFC 7807 Problem Details format:

\`\`\`json
{
  "type": "https://docs.easypost.com/errors#validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "The request body contains invalid data",
  "instance": "/api/shipments/create",
  "errors": [
    {
      "field": "from_address.zip",
      "message": "Invalid ZIP code format"
    }
  ]
}
\`\`\`
    `,
    version: '4.0.0',
    contact: {
      name: 'EasyPost API Support',
      url: 'https://www.easypost.com/support',
      email: 'support@easypost.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
    termsOfService: 'https://www.easypost.com/terms',
  },
  
  servers: [
    {
      url: 'https://api.easypost.com/v2',
      description: 'Production server',
    },
    {
      url: 'https://api.easypost.com/test',
      description: 'Test server',
    },
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
  ],

  security: [
    {
      ApiKeyAuth: [],
    },
    {
      BearerAuth: [],
    },
  ],

  tags: [
    {
      name: 'Shipments',
      description: 'Create, manage, and track shipments',
      externalDocs: {
        description: 'Shipment Guide',
        url: 'https://docs.easypost.com/docs/shipments',
      },
    },
    {
      name: 'Luma AI',
      description: 'AI-powered shipping recommendations and automation',
      externalDocs: {
        description: 'Luma AI Documentation',
        url: 'https://docs.easypost.com/docs/luma-ai',
      },
    },
    {
      name: 'Claims',
      description: 'Insurance claim management and processing',
    },
    {
      name: 'Forge',
      description: 'White-label platform and customer management',
    },
    {
      name: 'Analytics',
      description: 'Shipping analytics and performance insights',
    },
    {
      name: 'Tracking',
      description: 'Package tracking and delivery updates',
    },
    {
      name: 'Addresses',
      description: 'Address validation and verification',
    },
    {
      name: 'Batch',
      description: 'Bulk shipment processing and management',
    },
  ],

  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'System health check',
        description: 'Returns system health status and metrics',
        operationId: 'getHealth',
        responses: {
          '200': {
            description: 'System is healthy',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthStatus' },
                example: {
                  status: 'healthy',
                  timestamp: '2025-10-07T19:55:00Z',
                  version: '4.0.0',
                  nodejs: 'v22.11.0',
                  express: '5.1.0',
                  uptime: 3600.5,
                  memory: {
                    rss: 45678592,
                    heapTotal: 20971520,
                    heapUsed: 15728640,
                  },
                  services: {
                    easypost: 'connected',
                    redis: 'connected',
                    websocket: 'active',
                  },
                },
              },
            },
          },
        },
      },
    },

    '/api/shipments/create': {
      post: {
        tags: ['Shipments'],
        summary: 'Create a new shipment',
        description: 'Create a shipment and retrieve shipping rates from multiple carriers',
        operationId: 'createShipment',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateShipmentRequest' },
              examples: {
                domestic: {
                  summary: 'Domestic shipment',
                  description: 'Standard domestic shipment within the US',
                  value: {
                    from_address: {
                      street1: '417 Montgomery Street',
                      city: 'San Francisco',
                      state: 'CA',
                      zip: '94104',
                      name: 'EasyPost',
                      company: 'EasyPost',
                    },
                    to_address: {
                      street1: '118 2nd Street',
                      city: 'San Francisco',
                      state: 'CA',
                      zip: '94105',
                      name: 'Dr. Steve Brule',
                      phone: '415-456-7890',
                    },
                    parcel: {
                      length: 20.2,
                      width: 10.9,
                      height: 5,
                      weight: 65.9,
                    },
                    options: {
                      use_luma: true,
                      carbon_tracking: true,
                    },
                  },
                },
                international: {
                  summary: 'International shipment',
                  description: 'International shipment with customs',
                  value: {
                    from_address: {
                      street1: '417 Montgomery Street',
                      city: 'San Francisco',
                      state: 'CA',
                      zip: '94104',
                      country: 'US',
                      name: 'EasyPost',
                    },
                    to_address: {
                      street1: '1 E Main St',
                      city: 'Irvine',
                      state: 'CA',
                      zip: '92664',
                      country: 'CA',
                      name: 'Dr. Steve Brule',
                    },
                    parcel: {
                      length: 20.2,
                      width: 10.9,
                      height: 5,
                      weight: 65.9,
                    },
                    customs_info: {
                      customs_certify: true,
                      customs_signer: 'Steve Brule',
                      contents_type: 'merchandise',
                      restriction_type: 'none',
                      non_delivery_option: 'abandon',
                      customs_items: [
                        {
                          description: 'T-shirt',
                          quantity: 1,
                          weight: 65.9,
                          value: 10.0,
                          origin_country: 'US',
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Shipment created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ShipmentResponse' },
              },
            },
          },
          '400': {
            $ref: '#/components/responses/ValidationError',
          },
          '401': {
            $ref: '#/components/responses/AuthenticationError',
          },
          '429': {
            $ref: '#/components/responses/RateLimitError',
          },
        },
      },
    },

    '/api/luma/recommend': {
      post: {
        tags: ['Luma AI'],
        summary: 'Get AI shipping recommendations',
        description: 'Use Luma AI to get intelligent shipping recommendations with confidence scores',
        operationId: 'getLumaRecommendations',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LumaRequest' },
              example: {
                shipment: {
                  from_address: {
                    street1: '417 Montgomery Street',
                    city: 'San Francisco',
                    state: 'CA',
                    zip: '94104',
                  },
                  to_address: {
                    street1: '118 2nd Street',
                    city: 'San Francisco',
                    state: 'CA',
                    zip: '94105',
                  },
                  parcel: {
                    length: 10,
                    width: 8,
                    height: 4,
                    weight: 16,
                  },
                  preferences: {
                    priority: 'cost',
                    max_delivery_days: 5,
                    carbon_neutral: true,
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'AI recommendations generated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LumaResponse' },
              },
            },
          },
          '400': {
            $ref: '#/components/responses/ValidationError',
          },
        },
      },
    },

    '/api/claims': {
      post: {
        tags: ['Claims'],
        summary: 'Create insurance claim',
        description: 'Submit a new insurance claim with AI-assisted processing',
        operationId: 'createClaim',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateClaimRequest' },
              example: {
                type: 'damage',
                tracking_code: '1Z999AA1234567890',
                description: 'Package arrived with visible damage to contents',
                claimed_amount: 299.99,
                contact_email: 'customer@example.com',
                evidence: {
                  photos: [
                    'https://example.com/damage1.jpg',
                    'https://example.com/damage2.jpg',
                  ],
                },
                ai_analysis: true,
              },
            },
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['damage', 'loss', 'theft'] },
                  tracking_code: { type: 'string' },
                  description: { type: 'string' },
                  claimed_amount: { type: 'number' },
                  contact_email: { type: 'string', format: 'email' },
                  photos: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Claim created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Claim' },
              },
            },
          },
          '400': {
            $ref: '#/components/responses/ValidationError',
          },
        },
      },
      get: {
        tags: ['Claims'],
        summary: 'List claims',
        description: 'Retrieve a list of insurance claims with filtering options',
        operationId: 'listClaims',
        parameters: [
          {
            name: 'type',
            in: 'query',
            description: 'Filter by claim type',
            schema: {
              type: 'string',
              enum: ['damage', 'loss', 'theft', 'delay', 'other'],
            },
          },
          {
            name: 'status',
            in: 'query',
            description: 'Filter by claim status',
            schema: {
              type: 'string',
              enum: ['submitted', 'under_review', 'approved', 'denied', 'closed'],
            },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of results to return',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          },
          {
            name: 'offset',
            in: 'query',
            description: 'Number of results to skip',
            schema: { type: 'integer', minimum: 0, default: 0 },
          },
        ],
        responses: {
          '200': {
            description: 'Claims retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/PaginatedResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Claim' },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },

    '/api/forge/customers': {
      post: {
        tags: ['Forge'],
        summary: 'Create white-label customer',
        description: 'Create a new white-label customer account with independent billing',
        operationId: 'createForgeCustomer',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateForgeCustomerRequest' },
              example: {
                customer_info: {
                  company_name: 'Acme Shipping Co',
                  contact_name: 'John Doe',
                  email: 'john@acme.com',
                  phone: '+1-555-123-4567',
                },
                configuration: {
                  branding: {
                    primary_color: '#FF6B35',
                    logo_url: 'https://acme.com/logo.png',
                  },
                  features: {
                    luma_ai_enabled: true,
                    carbon_tracking: true,
                    advanced_analytics: false,
                  },
                  limits: {
                    monthly_shipments: 1000,
                    api_calls_per_hour: 500,
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Customer created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ForgeCustomer' },
              },
            },
          },
        },
      },
    },

    '/api/analytics/ai': {
      get: {
        tags: ['Analytics'],
        summary: 'Get AI-powered analytics',
        description: 'Retrieve shipping analytics with AI insights and predictions',
        operationId: 'getAiAnalytics',
        parameters: [
          {
            name: 'start_date',
            in: 'query',
            required: true,
            description: 'Start date for analytics period',
            schema: { type: 'string', format: 'date' },
            example: '2025-09-01',
          },
          {
            name: 'end_date',
            in: 'query',
            required: true,
            description: 'End date for analytics period',
            schema: { type: 'string', format: 'date' },
            example: '2025-10-01',
          },
          {
            name: 'type',
            in: 'query',
            description: 'Type of analysis to perform',
            schema: {
              type: 'string',
              enum: ['cost_optimization', 'carrier_performance', 'delivery_predictions', 'carbon_impact'],
              default: 'cost_optimization',
            },
          },
          {
            name: 'grouping',
            in: 'query',
            description: 'Data grouping interval',
            schema: {
              type: 'string',
              enum: ['daily', 'weekly', 'monthly'],
              default: 'weekly',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Analytics data retrieved successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AnalyticsResponse' },
              },
            },
          },
        },
      },
    },
  },

  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key for authentication',
      },
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token for authenticated sessions',
      },
    },

    schemas: {
      // Core schemas
      Address: {
        type: 'object',
        required: ['street1', 'city', 'state', 'zip', 'country'],
        properties: {
          id: { type: 'string', readOnly: true },
          street1: { type: 'string', minLength: 1, maxLength: 100 },
          street2: { type: 'string', maxLength: 100 },
          city: { type: 'string', minLength: 1, maxLength: 100 },
          state: { type: 'string', minLength: 2, maxLength: 2 },
          zip: { type: 'string', pattern: '^[0-9]{5}(-[0-9]{4})?$' },
          country: { type: 'string', minLength: 2, maxLength: 2, default: 'US' },
          name: { type: 'string', maxLength: 100 },
          company: { type: 'string', maxLength: 100 },
          phone: { type: 'string', maxLength: 20 },
          email: { type: 'string', format: 'email' },
          residential: { type: 'boolean' },
          verified: { type: 'boolean', readOnly: true },
        },
        example: {
          street1: '417 Montgomery Street',
          city: 'San Francisco',
          state: 'CA',
          zip: '94104',
          country: 'US',
          name: 'EasyPost',
          company: 'EasyPost',
        },
      },

      Parcel: {
        type: 'object',
        required: ['length', 'width', 'height', 'weight'],
        properties: {
          id: { type: 'string', readOnly: true },
          length: { type: 'number', minimum: 0.1, maximum: 999 },
          width: { type: 'number', minimum: 0.1, maximum: 999 },
          height: { type: 'number', minimum: 0.1, maximum: 999 },
          weight: { type: 'number', minimum: 0.1, maximum: 99999 },
          predefined_package: { type: 'string' },
        },
        example: {
          length: 20.2,
          width: 10.9,
          height: 5,
          weight: 65.9,
        },
      },

      Rate: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          service: { type: 'string' },
          carrier: { type: 'string' },
          rate: { type: 'string' },
          currency: { type: 'string', default: 'USD' },
          delivery_days: { type: 'integer', nullable: true },
          delivery_date: { type: 'string', format: 'date-time', nullable: true },
          delivery_date_guaranteed: { type: 'boolean' },
          carbon_offset: { type: 'string', nullable: true },
          ai_score: { type: 'integer', minimum: 0, maximum: 100 },
          sustainability_rating: { type: 'string', enum: ['A', 'B', 'C', 'D', 'F'] },
          reliability_score: { type: 'integer', minimum: 0, maximum: 100 },
        },
      },

      CreateShipmentRequest: {
        type: 'object',
        required: ['from_address', 'to_address', 'parcel'],
        properties: {
          from_address: { $ref: '#/components/schemas/Address' },
          to_address: { $ref: '#/components/schemas/Address' },
          parcel: { $ref: '#/components/schemas/Parcel' },
          options: {
            type: 'object',
            properties: {
              use_luma: { type: 'boolean', default: false },
              carbon_tracking: { type: 'boolean', default: false },
              realtime_tracking: { type: 'boolean', default: true },
              label_format: { type: 'string', enum: ['PDF', 'PNG', 'ZPL'], default: 'PDF' },
            },
          },
          customs_info: { $ref: '#/components/schemas/CustomsInfo' },
        },
      },

      ShipmentResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              shipment_id: { type: 'string' },
              rates: {
                type: 'array',
                items: { $ref: '#/components/schemas/Rate' },
              },
              lowest_rate: { $ref: '#/components/schemas/Rate' },
              ai_recommendations: {
                type: 'object',
                properties: {
                  best_value: { type: 'string' },
                  fastest: { type: 'string' },
                  most_reliable: { type: 'string' },
                  eco_friendly: { type: 'string' },
                },
              },
            },
          },
        },
      },

      LumaRequest: {
        type: 'object',
        required: ['shipment'],
        properties: {
          shipment: {
            type: 'object',
            required: ['from_address', 'to_address', 'parcel'],
            properties: {
              from_address: { $ref: '#/components/schemas/Address' },
              to_address: { $ref: '#/components/schemas/Address' },
              parcel: { $ref: '#/components/schemas/Parcel' },
              preferences: {
                type: 'object',
                properties: {
                  priority: { type: 'string', enum: ['cost', 'speed', 'reliability', 'carbon'] },
                  max_delivery_days: { type: 'integer', minimum: 1 },
                  max_cost: { type: 'number', minimum: 0 },
                  carbon_neutral: { type: 'boolean' },
                  signature_required: { type: 'boolean' },
                },
              },
            },
          },
        },
      },

      LumaResponse: {
        type: 'object',
        properties: {
          ai_analysis: {
            type: 'object',
            properties: {
              processing_time_ms: { type: 'integer' },
              model_version: { type: 'string' },
              confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
              data_points_analyzed: { type: 'integer' },
            },
          },
          recommendations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                carrier: { type: 'string' },
                service: { type: 'string' },
                estimated_cost: { type: 'string' },
                delivery_days: { type: 'integer' },
                confidence_score: { type: 'integer', minimum: 0, maximum: 100 },
                ai_reasoning: { type: 'string' },
                carbon_footprint: { type: 'string' },
                reliability_score: { type: 'integer' },
              },
            },
          },
        },
      },

      CreateClaimRequest: {
        type: 'object',
        required: ['type', 'tracking_code', 'description', 'claimed_amount', 'contact_email'],
        properties: {
          type: { type: 'string', enum: ['damage', 'loss', 'theft', 'delay', 'other'] },
          tracking_code: { type: 'string' },
          description: { type: 'string', minLength: 10, maxLength: 2000 },
          claimed_amount: { type: 'number', minimum: 0.01, maximum: 50000 },
          contact_email: { type: 'string', format: 'email' },
          evidence: {
            type: 'object',
            properties: {
              photos: {
                type: 'array',
                items: { type: 'string', format: 'uri' },
                maxItems: 10,
              },
              documents: {
                type: 'array',
                items: { type: 'string', format: 'uri' },
                maxItems: 5,
              },
            },
          },
          ai_analysis: { type: 'boolean', default: true },
        },
      },

      Claim: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: { type: 'string' },
          status: { type: 'string', enum: ['submitted', 'under_review', 'approved', 'denied', 'closed'] },
          tracking_code: { type: 'string' },
          description: { type: 'string' },
          claimed_amount: { type: 'string' },
          approved_amount: { type: 'string', nullable: true },
          contact_email: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
          ai_analysis: {
            type: 'object',
            nullable: true,
            properties: {
              risk_assessment: { type: 'string', enum: ['low', 'medium', 'high'] },
              fraud_indicators: { type: 'string' },
              evidence_quality: { type: 'string', enum: ['poor', 'fair', 'good', 'excellent'] },
              estimated_resolution_days: { type: 'integer' },
            },
          },
        },
      },

      CreateForgeCustomerRequest: {
        type: 'object',
        required: ['customer_info'],
        properties: {
          customer_info: {
            type: 'object',
            required: ['company_name', 'contact_name', 'email'],
            properties: {
              company_name: { type: 'string', minLength: 1, maxLength: 100 },
              contact_name: { type: 'string', minLength: 1, maxLength: 100 },
              email: { type: 'string', format: 'email' },
              phone: { type: 'string' },
            },
          },
          configuration: {
            type: 'object',
            properties: {
              branding: {
                type: 'object',
                properties: {
                  logo_url: { type: 'string', format: 'uri' },
                  primary_color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
                  secondary_color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
                },
              },
              features: {
                type: 'object',
                properties: {
                  luma_ai_enabled: { type: 'boolean', default: true },
                  carbon_tracking: { type: 'boolean', default: true },
                  advanced_analytics: { type: 'boolean', default: false },
                },
              },
              limits: {
                type: 'object',
                properties: {
                  monthly_shipments: { type: 'integer', minimum: 1 },
                  api_calls_per_hour: { type: 'integer', minimum: 100 },
                },
              },
            },
          },
        },
      },

      ForgeCustomer: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          status: { type: 'string', enum: ['active', 'suspended', 'terminated'] },
          customer_info: {
            type: 'object',
            properties: {
              company_name: { type: 'string' },
              contact_name: { type: 'string' },
              email: { type: 'string' },
              phone: { type: 'string' },
            },
          },
          api_keys: {
            type: 'object',
            properties: {
              production: { type: 'string' },
              test: { type: 'string' },
            },
          },
          portal_url: { type: 'string', format: 'uri' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },

      AnalyticsResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              summary: {
                type: 'object',
                properties: {
                  period: { type: 'string' },
                  total_shipments: { type: 'integer' },
                  total_cost: { type: 'string' },
                  ai_optimization_savings: { type: 'string' },
                  carbon_footprint: { type: 'string' },
                },
              },
              ai_insights: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string' },
                    title: { type: 'string' },
                    impact: { type: 'string' },
                    confidence: { type: 'integer' },
                  },
                },
              },
              predictions: {
                type: 'object',
                properties: {
                  next_month_volume: { type: 'integer' },
                  next_month_cost: { type: 'string' },
                  recommended_actions: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },

      CustomsInfo: {
        type: 'object',
        required: ['customs_certify', 'customs_signer', 'contents_type'],
        properties: {
          customs_certify: { type: 'boolean' },
          customs_signer: { type: 'string' },
          contents_type: { type: 'string', enum: ['gift', 'merchandise', 'documents', 'returned_goods', 'sample'] },
          contents_explanation: { type: 'string' },
          restriction_type: { type: 'string', enum: ['none', 'other', 'quarantine'] },
          non_delivery_option: { type: 'string', enum: ['abandon', 'return'] },
          customs_items: {
            type: 'array',
            items: { $ref: '#/components/schemas/CustomsItem' },
          },
        },
      },

      CustomsItem: {
        type: 'object',
        required: ['description', 'quantity', 'weight', 'value'],
        properties: {
          description: { type: 'string' },
          quantity: { type: 'integer', minimum: 1 },
          weight: { type: 'number', minimum: 0.1 },
          value: { type: 'number', minimum: 0.01 },
          hs_tariff_number: { type: 'string' },
          origin_country: { type: 'string', minLength: 2, maxLength: 2 },
        },
      },

      HealthStatus: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
          timestamp: { type: 'string', format: 'date-time' },
          version: { type: 'string' },
          nodejs: { type: 'string' },
          express: { type: 'string' },
          uptime: { type: 'number' },
          memory: {
            type: 'object',
            properties: {
              rss: { type: 'integer' },
              heapTotal: { type: 'integer' },
              heapUsed: { type: 'integer' },
            },
          },
          services: {
            type: 'object',
            additionalProperties: { type: 'string' },
          },
        },
      },

      PaginatedResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          pagination: {
            type: 'object',
            properties: {
              total: { type: 'integer' },
              count: { type: 'integer' },
              offset: { type: 'integer' },
              limit: { type: 'integer' },
              has_more: { type: 'boolean' },
            },
          },
        },
      },

      Error: {
        type: 'object',
        properties: {
          type: { type: 'string', format: 'uri' },
          title: { type: 'string' },
          status: { type: 'integer' },
          detail: { type: 'string' },
          instance: { type: 'string' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                message: { type: 'string' },
                code: { type: 'string' },
              },
            },
          },
        },
      },
    },

    responses: {
      ValidationError: {
        description: 'Request validation failed',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              type: 'https://docs.easypost.com/errors#validation-error',
              title: 'Validation Error',
              status: 400,
              detail: 'The request body contains invalid data',
              instance: '/api/shipments/create',
              errors: [
                {
                  field: 'from_address.zip',
                  message: 'Invalid ZIP code format',
                  code: 'INVALID_FORMAT',
                },
              ],
            },
          },
        },
      },

      AuthenticationError: {
        description: 'Authentication failed',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              type: 'https://docs.easypost.com/errors#authentication-error',
              title: 'Authentication Error',
              status: 401,
              detail: 'Invalid or missing API key',
              instance: '/api/shipments/create',
            },
          },
        },
      },

      RateLimitError: {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              type: 'https://docs.easypost.com/errors#rate-limit-error',
              title: 'Rate Limit Exceeded',
              status: 429,
              detail: 'Too many requests. Please wait before making additional requests.',
              instance: '/api/shipments/create',
            },
          },
        },
        headers: {
          'Retry-After': {
            description: 'Number of seconds to wait before making another request',
            schema: { type: 'integer' },
          },
          'X-RateLimit-Limit': {
            description: 'The number of allowed requests in the current period',
            schema: { type: 'integer' },
          },
          'X-RateLimit-Remaining': {
            description: 'The number of remaining requests in the current period',
            schema: { type: 'integer' },
          },
        },
      },
    },

    examples: {
      DomesticShipment: {
        summary: 'Standard domestic shipment',
        value: {
          from_address: {
            street1: '417 Montgomery Street',
            city: 'San Francisco',
            state: 'CA',
            zip: '94104',
            country: 'US',
          },
          to_address: {
            street1: '118 2nd Street',
            city: 'San Francisco',
            state: 'CA',
            zip: '94105',
            country: 'US',
          },
          parcel: {
            length: 10,
            width: 8,
            height: 4,
            weight: 16,
          },
        },
      },
    },

    headers: {
      'X-Request-ID': {
        description: 'Unique identifier for the request',
        schema: { type: 'string', format: 'uuid' },
      },
      'X-Response-Time': {
        description: 'Response time in milliseconds',
        schema: { type: 'integer' },
      },
      'X-API-Version': {
        description: 'API version used to process the request',
        schema: { type: 'string' },
      },
    },
  },

  // Webhook documentation
  webhooks: {
    shipmentUpdate: {
      post: {
        requestBody: {
          description: 'Shipment status update notification',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  event_type: { type: 'string', example: 'shipment.delivered' },
                  created_at: { type: 'string', format: 'date-time' },
                  object: { $ref: '#/components/schemas/ShipmentResponse' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Webhook received and processed successfully',
          },
        },
      },
    },
  },
};