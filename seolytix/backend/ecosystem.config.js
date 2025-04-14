module.exports = {
    apps: [{
        name: "seolytix-backend",
        script: "server.js",
        env: {
            NODE_ENV: "production",
            PORT: 5010
        },
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: "300M",
        log_date_format: "YYYY-MM-DD HH:mm:ss"
    }]
};