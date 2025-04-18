module.exports = {
  apps: [{
    name: 'hue-proxy',
    script: 'hue-proxy.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '200M',
    env: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 8080
    }
  }]
};
