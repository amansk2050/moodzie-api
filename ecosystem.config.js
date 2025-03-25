module.exports = {
  apps: [
    {
      name: 'moodzie-api',
      script: './src/main.js',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
    },
  ],

  deploy: {
    production: {
      user: 'node',
      host: 'your-production-server',
      ref: 'origin/main',
      repo: 'git@github.com:username/moodzie-app.git',
      path: '/var/www/moodzie-api',
      'post-deploy':
        'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
    },
    development: {
      user: 'node',
      host: 'your-dev-server',
      ref: 'origin/develop',
      repo: 'git@github.com:username/moodzie-app.git',
      path: '/var/www/dev/moodzie-api',
      'post-deploy':
        'npm install && npm run build && pm2 reload ecosystem.config.js --env development',
    },
  },
};
