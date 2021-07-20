require('dotenv').config();

let ssl = false;

if (process.env.PGSSL) {
    ssl = true;
}

module.exports = {
    APP_NAME: 'Validator Services',
    VERSION: process.env.npm_package_version,
    NODE_ENV: process.env.NODE_ENV,
    APPINSIGHTS_INSTRUMENTATIONKEY: process.env.APPINSIGHTS_INSTRUMENTATIONKEY,
    NS_PER_SEC: 1e9,
    STORAGECONNECTOR: process.env.STORAGECONNECTOR,
    PGCONFIG: {
        host: process.env.PGHOST,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
        port: process.env.PGPORT,
        ssl,
    },
};
