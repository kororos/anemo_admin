import { readdirSync } from "fs";
// import path  here 
import path from "path";
import { basename, dirname } from "path";
import { Sequelize, DataTypes } from "sequelize";
import { fileURLToPath } from "url";
import configJS from "../config/config.js";

const __basename = path.basename(import.meta.url);
const env = process.env.NODE_ENV || "development";
const config = configJS[env];
const __dirname = fileURLToPath(path.dirname(import.meta.url));
let sequelize;

if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
}
const db = {};
export default await (async () => {
  const files = readdirSync(__dirname).filter(
    (file) =>
      file.indexOf(".") !== 0 &&
      file !== __basename &&
      file.slice(-3) === ".js"
  );

  for await (const file of files) {
// use path here to access your models from models directory then await for it @
    const model = await import(path.join(path.dirname(import.meta.url), file));
    if (model.default) {
      const namedModel = await model.default(sequelize, DataTypes);
      db[namedModel.name] = namedModel;
    }
  }

  Object.keys(db).forEach((modelName) => {
    if (modelName) {
      if (db[modelName].associate) {
        db[modelName].associate(db);
      }
    }
  });

  db.sequelize = sequelize;
  db.Sequelize = Sequelize;
  return db;
})();