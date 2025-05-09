'use strict';
import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class Device extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Device.init({
    macAddress: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    name: DataTypes.STRING,
    lastConnection: DataTypes.DATE,
    hwVersion: DataTypes.STRING,
    fwVersion: DataTypes.STRING,
    arcStart: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 360
      }
    },
    arcEnd: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 360
      }
    }
  }, {
    sequelize,
    modelName: 'Device',
  });
  return Device;
};