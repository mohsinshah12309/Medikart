/**
 * Medikart Production Multi-Core Cluster & Load Balancing Configuration
 * PM2 Enterprise Process Manager
 *
 * Runs Express API and Next.js Web in Cluster Mode across all available CPU cores.
 * Automatic zero-downtime rolling reload: pm2 reload ecosystem.config.js
 */

module.exports = {
  apps: [
    {
      name: 'medikart-api',
      script: './server/src/app.js',
      cwd: './server',
      instances: 2, // Load balanced across 2 vCPU cores
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '850M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      exp_backoff_restart_delay: 100,
      listen_timeout: 10000,
      kill_timeout: 5000,
    },
    {
      name: 'medikart-web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      cwd: './apps/web',
      instances: 2, // Load balanced across 2 vCPU cores
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1400M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      exp_backoff_restart_delay: 100,
      listen_timeout: 15000,
      kill_timeout: 8000,
    },
  ],
};
