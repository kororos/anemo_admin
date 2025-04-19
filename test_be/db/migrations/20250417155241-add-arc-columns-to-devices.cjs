'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Devices', 'arcStart', {
      type: Sequelize.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 360
      }
    });
    
    await queryInterface.addColumn('Devices', 'arcEnd', {
      type: Sequelize.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 360
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Devices', 'arcStart');
    await queryInterface.removeColumn('Devices', 'arcEnd');
  }
};
