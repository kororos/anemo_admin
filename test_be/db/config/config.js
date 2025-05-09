import dockerSecret from './secrets.js';

export default {
  development: {
    username: dockerSecret.read(process.env.DB_USER_DEV_FILE) || process.env.DB_USERNAME_DEV || "anemo_admin",
    password: dockerSecret.read(process.env.DB_PASSWORD_DEV_FILE) || process.env.DB_PASSWORD_DEV || "anemo_admin",
    database: process.env.DB_NAME_DEV || "anemo-admin-dev",
    host: process.env.DB_HOST_DEV || "127.0.0.1",
    dialect: "postgres",
    googleClientId: dockerSecret.read(process.env.GOOGLE_CLIENT_ID_DEV_FILE) || process.env.GOOGLE_CLIENT_ID_DEV,
    googleClientSecret: dockerSecret.read(process.env.GOOGLE_CLIENT_SECRET_DEV_FILE) || process.env.GOOGLE_CLIENT_SECRET_DEV,
  },
  test: {
    username: dockerSecret.read(process.env.DB_USER_TEST_FILE) || process.env.DB_USERNAME_TEST || "anemo-admin-test",
    password: dockerSecret.read(process.env.DB_PASSWORD_TEST_FILE) || process.env.DB_PASSWORD_TEST || "",
    database: process.env.DB_NAME_TEST || "anemo-admin-test",
    host: process.env.DB_HOST_TEST || "127.0.0.1",
    dialect: "postgres",
    googleClientId: dockerSecret.read(process.env.GOOGLE_CLIENT_ID_TEST_FILE) || process.env.GOOGLE_CLIENT_ID_TEST,
    googleClientSecret: dockerSecret.read(process.env.GOOGLE_CLIENT_SECRET_TEST_FILE) || process.env.GOOGLE_CLIENT_SECRET_TEST,
  },
  production: {
    username: dockerSecret.read(process.env.DB_USER_PROD_FILE) || process.env.DB_USERNAME,
    password: dockerSecret.read(process.env.DB_PASSWORD_PROD_FILE) ||process.env.DB_PASSWORD_PROD || "",
    database: process.env.DB_NAME_PROD || "anemo-admin-prod",
    host: process.env.DB_HOST_DEV || "127.0.0.1",
    dialect: "postgres",
    logging: false,
    googleClientId: dockerSecret.read(process.env.GOOGLE_CLIENT_ID_PROD_FILE) || process.env.GOOGLE_CLIENT_ID_PROD,
    googleClientSecret: dockerSecret.read(process.env.GOOGLE_CLIENT_SECRET_PROD_FILE) || process.env.GOOGLE_CLIENT_SECRET_PROD,
  }
}
