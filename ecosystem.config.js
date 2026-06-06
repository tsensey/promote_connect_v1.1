module.exports = {
  apps: [
    {
      name: "promote-connect",

      cwd: "/var/www/promote-connect",

      script: "npm",
      args: "start",

      instances: 2,
      exec_mode: "cluster",

      autorestart: true,
      watch: false,

      max_memory_restart: "1G",

      node_args: "--max-old-space-size=2048",

      env: {
        NODE_ENV: "production",
        PORT: 3000
      },

      out_file: "/home/deploy/.pm2/logs/promote-connect-out.log",
      error_file: "/home/deploy/.pm2/logs/promote-connect-error.log",

      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",

      listen_timeout: 10000,
      kill_timeout: 5000,

      min_uptime: "10s",
      max_restarts: 20,

      exp_backoff_restart_delay: 100
    }
  ]
};
