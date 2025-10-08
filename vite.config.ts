import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';
import { fileURLToPath, URL } from 'node:url';

// Vite plugins
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

export default defineConfig(({ command, mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    // Base configuration
    root: 'web',
    base: '/',
    
    // Build configuration
    build: {
      target: 'es2022',
      outDir: '../dist/web',
      assetsDir: 'assets',
      sourcemap: mode === 'development',
      minify: mode === 'production' ? 'esbuild' : false,
      
      // Rollup options
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'web/index.html'),
          admin: resolve(__dirname, 'web/admin.html'), // Admin interface
        },
        output: {
          // Modern ES modules for supported browsers
          format: 'es',
          entryFileNames: 'js/[name]-[hash].js',
          chunkFileNames: 'js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            
            if (/\.(css)$/.test(assetInfo.name)) {
              return 'css/[name]-[hash][extname]';
            }
            if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
              return 'images/[name]-[hash][extname]';
            }
            if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
              return 'fonts/[name]-[hash][extname]';
            }
            
            return 'assets/[name]-[hash][extname]';
          },
          
          // Code splitting for better performance
          manualChunks: {
            vendor: ['chart.js'],
            utils: ['lodash-es', 'date-fns'],
          },
        },
      },
      
      // Legacy build for older browsers
      legacy: {
        targets: ['defaults', 'not IE 11'],
        additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
      },
      
      // Performance optimizations
      chunkSizeWarningLimit: 1000,
      
      // CSS processing
      cssCodeSplit: true,
      cssTarget: 'es2020',
    },
    
    // Development server
    server: {
      port: 5173,
      host: '0.0.0.0',
      strictPort: false,
      open: true,
      cors: true,
      
      // Proxy API requests to backend
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          ws: true, // WebSocket proxy
        },
        '/socket.io': {
          target: 'ws://localhost:3000',
          ws: true,
        },
      },
      
      // Hot Module Replacement
      hmr: {
        port: 5174,
        overlay: true,
      },
    },
    
    // Preview server (production preview)
    preview: {
      port: 4173,
      host: '0.0.0.0',
      strictPort: false,
      open: true,
      cors: true,
    },
    
    // Path resolution
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./web', import.meta.url)),
        '@components': fileURLToPath(new URL('./web/components', import.meta.url)),
        '@utils': fileURLToPath(new URL('./web/utils', import.meta.url)),
        '@styles': fileURLToPath(new URL('./web/styles', import.meta.url)),
        '@assets': fileURLToPath(new URL('./web/assets', import.meta.url)),
        '@types': fileURLToPath(new URL('./src/types', import.meta.url)),
      },
      extensions: ['.js', '.ts', '.json', '.css', '.scss', '.vue'],
    },
    
    // CSS processing
    css: {
      modules: {
        scopeBehaviour: 'local',
        generateScopedName: mode === 'development' 
          ? '[name]__[local]___[hash:base64:5]'
          : '[hash:base64:8]',
      },
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@styles/variables.scss"; @import "@styles/mixins.scss";`,
        },
      },
      postcss: {
        plugins: [
          require('autoprefixer'),
          require('postcss-nesting'),
          require('postcss-custom-media'),
          require('postcss-preset-env')({
            stage: 1,
            features: {
              'nesting-rules': true,
              'custom-properties': true,
              'media-query-ranges': true,
              'custom-media-queries': true,
            },
          }),
          ...(mode === 'production' 
            ? [
                require('cssnano')({
                  preset: ['default', {
                    discardComments: { removeAll: true },
                    normalizeWhitespace: true,
                    minifySelectors: true,
                  }],
                }),
              ]
            : []
          ),
        ],
      },
    },
    
    // JavaScript/TypeScript processing
    esbuild: {
      target: 'es2022',
      format: 'esm',
      platform: 'browser',
      keepNames: true,
      
      // Remove console.log in production
      ...(mode === 'production' && {
        drop: ['console', 'debugger'],
        minifyIdentifiers: true,
        minifySyntax: true,
        minifyWhitespace: true,
      }),
    },
    
    // Optimization
    optimizeDeps: {
      include: [
        'chart.js',
        'date-fns',
        'lodash-es',
      ],
      exclude: [
        '@easypost/api', // Server-side only
      ],
      esbuildOptions: {
        target: 'es2022',
      },
    },
    
    // Environment variables
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __DEV__: JSON.stringify(mode === 'development'),
    },
    
    // Worker configuration
    worker: {
      format: 'es',
      plugins: [],
    },
    
    // JSON processing
    json: {
      namedExports: true,
      stringify: false,
    },
    
    // Asset processing
    assetsInclude: [
      '**/*.woff',
      '**/*.woff2',
      '**/*.ttf',
      '**/*.eot',
    ],
    
    // Plugin configuration
    plugins: [
      // Custom plugin for EasyPost integration
      {
        name: 'easypost-integration',
        configResolved(config) {
          console.log('🚀 EasyPost MCP Dashboard Build Configuration:');
          console.log(`   Mode: ${config.command} (${config.mode})`);
          console.log(`   Target: ${config.build.target}`);
          console.log(`   Output: ${config.build.outDir}`);
        },
        
        buildStart() {
          console.log('📦 Building modern shipping dashboard...');
        },
        
        buildEnd() {
          console.log('✅ Build completed successfully!');
        },
        
        // Hot reload for development
        handleHotUpdate(ctx) {
          if (ctx.file.endsWith('.css') || ctx.file.endsWith('.js')) {
            console.log(`🔥 Hot reload: ${ctx.file}`);
          }
        },
      },
      
      // PWA support
      {
        name: 'pwa-manifest',
        generateBundle() {
          // Generate service worker and manifest
          this.emitFile({
            type: 'asset',
            fileName: 'manifest.json',
            source: JSON.stringify({
              name: 'EasyPost Dashboard',
              short_name: 'EasyPost',
              description: 'AI-powered shipping management platform',
              start_url: '/',
              display: 'standalone',
              background_color: '#A47C48',
              theme_color: '#A47C48',
              orientation: 'portrait-primary',
              icons: [
                {
                  src: '/icons/icon-192.png',
                  sizes: '192x192',
                  type: 'image/png',
                  purpose: 'any maskable',
                },
                {
                  src: '/icons/icon-512.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'any maskable',
                },
              ],
              categories: ['business', 'productivity', 'utilities'],
              lang: 'en-US',
              dir: 'ltr',
            }, null, 2),
          });
        },
      },
      
      // Bundle analyzer (development only)
      ...(mode === 'development' ? [
        {
          name: 'bundle-analyzer',
          writeBundle() {
            if (env.ANALYZE === 'true') {
              console.log('📊 Bundle analysis available at http://localhost:8888');
            }
          },
        },
      ] : []),
    ],
    
    // Experimental features
    experimental: {
      renderBuiltUrl(filename, { hostType }) {
        if (hostType === 'js') {
          return { js: `/${filename}` };
        } else {
          return { relative: true };
        }
      },
    },
    
    // SSR configuration (if needed)
    ssr: {
      noExternal: ['chart.js'],
      target: 'node',
    },
    
    // Cache configuration
    cacheDir: '.vite',
    
    // Log level
    logLevel: mode === 'development' ? 'info' : 'warn',
  };
});