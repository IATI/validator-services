import 'dotenv/config';
import { readFile } from 'fs/promises';

const { version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url)));

let ssl = false;

if (process.env.PGSSL) {
    ssl = true;
}

const config = {
    APP_NAME: 'Validator Services',
    VERSION: version,
    NODE_ENV: process.env.NODE_ENV,
    NS_PER_SEC: 1e9,
    STORAGECONNECTOR: process.env.STORAGECONNECTOR,
    ADHOC_CONTAINER: process.env.ADHOC_CONTAINER,
    VALIDATOR_API_URL: process.env.VALIDATOR_API_URL,
    VALIDATOR_FUNC_KEY: process.env.VALIDATOR_FUNC_KEY,
    VERSIONS: process.env.VERSIONS || ['2.01', '2.02', '2.03'],
    REDIS_PORT: process.env.REDIS_PORT || 6379,
    REDIS_CACHE_SEC: process.env.REDIS_CACHE_SEC || 86400,
    REDIS_KEY: process.env.REDIS_KEY,
    REDIS_HOSTNAME: process.env.REDIS_HOSTNAME,
    GITHUB_BASIC_TOKEN: process.env.GITHUB_BASIC_TOKEN,
    PGCONFIG: {
        host: process.env.PGHOST,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
        port: process.env.PGPORT,
        ssl,
    },
};

export default config;
