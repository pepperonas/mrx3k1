module.exports = {
    apps: [{
        name: "objectcut",
        script: "server/server.js",
        env: {
            NODE_ENV: "production",
            PORT: 4991,
            U2NET_HOME: "/tmp/u2net",
            PATH: "/var/www/html/objectcut-react/venv/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
        },
        watch: false,
        instances: 1,
        exec_mode: "fork",
        max_restarts: 10,
        restart_delay: 5000
    }]
};