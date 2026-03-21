module.exports = {
  "apps": [
    {
      "name": "trackup-backend",
      "script": "dist/index.js",
      "interpreter": "node",
      "node_args": "-r ./tsconfig-paths-bootstrap.js",
      "instances": 1,
      "exec_mode": "fork",
      "env": {
        "NODE_ENV": "production",
        "PORT": 8000
      },
      "autorestart": true,
      "max_memory_restart": "512M",
      "exp_backoff_restart_delay": 2000,
      "max_restarts": 10,
      "kill_timeout": 5000,
      "listen_timeout": 5000,
      "watch": false,
      "out_file": "/home/ec2-user/.pm2/logs/trackup-backend/out.log",
      "error_file": "/home/ec2-user/.pm2/logs/trackup-backend/error.log",
      "merge_logs": true,
      "disable_logs": false
    }
  ]
}