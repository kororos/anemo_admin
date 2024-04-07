'use strict';
import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class PendingUpdates extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here 
      this.belongsTo(models.User, {foreignKey:'initiatorUserId'});
    }
  }
  PendingUpdates.init({
    UUID: DataTypes.UUID,
    currentFwVersion: DataTypes.STRING,
    requestedFwVersion: DataTypes.STRING,
    initiatorUserId: DataTypes.INTEGER,
    status: {
      type: DataTypes.ENUM('PENDING', 'COMPLETED', 'FAILED'),
    },
    macAddress: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'PendingUpdates',
  });
  return PendingUpdates;
};