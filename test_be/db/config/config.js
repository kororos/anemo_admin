import dockerSecret from './secrets.js';

export default {
  development: {
    username: process.env.DB_USERNAME_DEV || "anemo-dev",
    password: dockerSecret.read(process.env.DB_PASSWORD_DEV_FILE) || process.env.DB_PASSWORD_DEV || "anemo-dev",
    database: "anemo-admin-dev",
    host: "127.0.0.1",
    dialect: "postgres"
  },
  test: {
    username: process.env.DB_USERNAME_TEST || "anemo-admin-test",
    password: dockerSecret.read(process.env.DB_PASSWORD_TEST_FILE) || process.env.DB_PASSWORD_TEST || "",
    database: "anemo-admin-test",
    host: "127.0.0.1",
    dialect: "postgres"
  },
  production: {
    username: process.env.DB_USERNAME,
    password: dockerSecret.read(process.env.DB_PASSWORD_PROD_FILE) ||process.env.DB_PASSWORD_PROD || "",
    database: "anemo-admin-prod",
    host: "127.0.0.1",
    dialect: "postgres"
  }
}
