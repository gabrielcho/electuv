'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {


    return await queryInterface.addColumn(
      'Reviews',
      'votes',
     Sequelize.INTEGER
    );
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
  },

  down: async (queryInterface, Sequelize) => {
    return await queryInterface.removeColumn(
      'Reviews',
      'votes'
    )
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
