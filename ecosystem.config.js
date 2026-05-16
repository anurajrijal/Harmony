module.exports = {
  apps: [
    {
      name: 'harmony-backend',
      script: 'src/server.js',
      cwd: './Backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'harmony-bot',
      script: 'src/bot.js',
      cwd: './bot',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
