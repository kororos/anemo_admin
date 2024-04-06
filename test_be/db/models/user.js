'use strict';
import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.hasMany(models.PendingUpdates, 
        {
          foreignKey: 'initiatorUserId',
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        })
    }
  }
  User.init({
    name: DataTypes.STRING,
    status: DataTypes.ENUM('active', 'inactive', 'locked'),
    birth: DataTypes.DATE,
    role: DataTypes.ENUM('Admin', 'Guest'),
    email: {type: DataTypes.STRING, unique: true },
    family_name: DataTypes.STRING,
    given_name: DataTypes.STRING,
    password: DataTypes.STRING,
    photo_link: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};