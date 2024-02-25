export default {
  development: {
    username: process.env.DB_USERNAME_DEV || "anemo-dev",
    password: process.env.DB_PASSWORD_DEV || "anemo-dev",
    database: "anemo-admin-dev",
    host: "127.0.0.1",
    dialect: "postgres"
  },
  test: {
    username: process.env.DB_USERNAME_TEST || "anemo-admin-test",
    password: process.env.DB_PASSWORD_TEST || "",
    database: "anemo-admin-test",
    host: "127.0.0.1",
    dialect: "postgres"
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD || "",
    database: "anemo-admin-prod",
    host: "127.0.0.1",
    dialect: "postgres"
  }
}
