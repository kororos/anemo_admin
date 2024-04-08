'use strict';
import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class Firmware extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Firmware.init({
    swVersion: {
      type: DataTypes.STRING,
      unique: 'hwVersion_swVersion'
    },
    hwVersion: {
      type: DataTypes.STRING,
      unique: 'hwVersion_swVersion'
    },
    path: DataTypes.STRING,
    filename: DataTypes.STRING,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  }, {
    sequelize,
    modelName: 'Firmware',
    tableName: 'Firmware'
  });
  return Firmware;
};