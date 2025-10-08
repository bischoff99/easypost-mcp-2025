# Nginx Reverse Proxy for EasyPost MCP Server 2025 - Staging

FROM nginx:1.25-alpine

# Install additional tools
RUN apk add --no-cache \
    curl \
    bash \
    openssl

# Remove default nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom configurations
COPY nginx.staging.conf /etc/nginx/nginx.conf
COPY proxy_params.conf /etc/nginx/proxy_params.conf

# Create SSL directory (for future use)
RUN mkdir -p /etc/nginx/ssl && \
    chmod 755 /etc/nginx/ssl

# Create log directory
RUN mkdir -p /var/log/nginx && \
    chmod 755 /var/log/nginx

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Expose ports
EXPOSE 80 443

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

