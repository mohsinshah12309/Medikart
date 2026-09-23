/**
 * Root PM2 Ecosystem Configuration for Hostinger VPS Deployment
 * 
 * Orchestrates:
 * 1. medikart-backend: Express API in cluster mode (scaled across all CPU cores on port 5000)
 * 2. medikart-storefront: Next.js production server (port 3000)
 * 
 * Usage on VPS:
 *   pm2 start ecosystem.config.js
 *   pm2 save
 *   pm2 startup
 */

module.exports = {
  apps: [
    {
      name: "medikart-backend",
      cwd: "/var/www/medikart/server",
      script: "src/app.js",
      instances: "max", // Scale across all available VPS CPU cores
      exec_mode: "cluster",
      watch: false,
      max_memory_restart: "600M",
      node_args: "--max-old-space-size=1024",
      listen_timeout: 10000,
      kill_timeout: 5000,
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
      out_file: "/var/log/pm2/medikart-backend-out.log",
      error_file: "/var/log/pm2/medikart-backend-err.log",
      merge_logs: true,
      time: true,
    },
    {
      name: "medikart-storefront",
      cwd: "/var/www/medikart/apps/web",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 1, // Next.js handles internal concurrency
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "800M",
      node_args: "--max-old-space-size=2048",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      out_file: "/var/log/pm2/medikart-web-out.log",
      error_file: "/var/log/pm2/medikart-web-err.log",
      merge_logs: true,
      time: true,
    },
  ],
};
