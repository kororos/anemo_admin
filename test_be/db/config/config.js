import dockerSecret from './secrets.js';

export default {
  development: {
    username: dockerSecret.read(process.env.DB_USER_DEV_FILE) || process.env.DB_USERNAME_DEV || "anemo-dev",
    password: dockerSecret.read(process.env.DB_PASSWORD_DEV_FILE) || process.env.DB_PASSWORD_DEV || "anemo-dev",
    database: process.env.DB_NAME_DEV || "anemo-admin-dev",
    host: process.env.DB_HOST_DEV || "127.0.0.1",
    dialect: "postgres"
  },
  test: {
    username: dockerSecret.read(process.env.DB_USER_TEST_FILE) || process.env.DB_USERNAME_TEST || "anemo-admin-test",
    password: dockerSecret.read(process.env.DB_PASSWORD_TEST_FILE) || process.env.DB_PASSWORD_TEST || "",
    database: process.env.DB_NAME_TEST || "anemo-admin-test",
    host: process.env.DB_HOST_TEST || "127.0.0.1",
    dialect: "postgres"
  },
  production: {
    username: dockerSecret.read(process.env.DB_USER_PROD_FILE) || process.env.DB_USERNAME,
    password: dockerSecret.read(process.env.DB_PASSWORD_PROD_FILE) ||process.env.DB_PASSWORD_PROD || "",
    database: process.env.DB_NAME_PROD || "anemo-admin-prod",
    host: process.env.DB_HOST_DEV || "127.0.0.1",
    dialect: "postgres"
  }
}
