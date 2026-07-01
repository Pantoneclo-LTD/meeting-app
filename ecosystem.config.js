module.exports = {
  apps: [
    {
      name: "meeting-app",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: "/var/www/meeting-app",
      env: {
        NODE_ENV: "production",
        PORT: 3003,
      }
    }
  ]
};
