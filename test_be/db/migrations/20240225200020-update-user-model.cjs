'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('Users', 'password', { type: Sequelize.STRING });
    await queryInterface.removeColumn('Users', 'card');
    await queryInterface.removeColumn('Users', 'state');
    await queryInterface.addColumn('Users', 'status', { type: Sequelize.ENUM('active', 'inactive', 'locked') });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('Users', 'password');
    await queryInterface.addColumn('Users', 'card', { type: Sequelize.INTEGER });
    await queryInterface.addColumn('Users', 'state', { type: Sequelize.BOOLEAN });
    await queryInterface.removeColumn('Users', 'status');
  }
};
