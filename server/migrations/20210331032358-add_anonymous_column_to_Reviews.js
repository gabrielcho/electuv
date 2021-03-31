'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Reviews', 'anonymous', {
      type: Sequelize.BOOLEAN,
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('reviews', 'anonymous');
  }
};
