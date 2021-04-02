'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Courses', 'rating');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Courses', 'rating', {
      type: Sequelize.FLOAT
    });
  }
};
