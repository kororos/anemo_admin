import fs from 'fs';
import path from 'path';
import Sequelize from 'sequelize';
import process from 'process';
import configJson from '../config/config.json';

const basename = path.basename(import.meta.url);
const env = process.env.NODE_ENV || 'development';
const config = configJson[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

const files = fs.readdirSync(path.dirname(import.meta.url));
files
  .filter(file => (
    file.indexOf('.') !== 0 &&
    file !== basename &&
    file.slice(-3) === '.js' &&
    file.indexOf('.test.js') === -1
  ))
  .forEach(async file => {
    const model = await import(path.join(path.dirname(import.meta.url), file));
    db[model.name] = model.default(sequelize, Sequelize.DataTypes);
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;