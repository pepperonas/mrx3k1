module.exports = {
    apps: [{
        name: "voicextract-api",
        script: "./server.js",
        env: {
            NODE_ENV: "production",
            PORT: 4992
        },
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: "1G"
    }]
};