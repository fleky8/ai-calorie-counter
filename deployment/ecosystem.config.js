module.exports = {
  apps: [{
    name: 'ai-calorie-counter-backend',
    script: './backend/server.js',
    cwd: '/var/www/ai-calorie-counter',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/ai-calorie-counter/error.log',
    out_file: '/var/log/ai-calorie-counter/out.log',
    log_file: '/var/log/ai-calorie-counter/combined.log',
    time: true
  }]
};