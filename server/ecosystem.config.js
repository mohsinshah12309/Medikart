/**
 * PM2 Ecosystem Configuration — Medikart Production & Staging Cluster Mode.
 *
 * Runs multiple Node worker processes across all available VPS CPU cores
 * (instances: "max" or numerical count), providing process-level load balancing,
 * zero-downtime reloads (pm2 reload), automatic crash restart, and memory guard.
 */

module.exports = {
  apps: [
    {
      name: "medikart-backend",
      script: "src/app.js",
      instances: "max", // Scale to all available CPU cores on VPS
      exec_mode: "cluster",
      watch: false,
      max_memory_restart: "500M", // Restart worker if memory leaks exceed 500MB
      node_args: "--max-old-space-size=1024",
      listen_timeout: 10000,
      kill_timeout: 5000,
      wait_ready: false,
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
      env_development: {
        NODE_ENV: "development",
        PORT: 5000,
      },
      out_file: "./logs/pm2-out.log",
      error_file: "./logs/pm2-err.log",
      merge_logs: true,
      time: true,
    },
  ],
};
