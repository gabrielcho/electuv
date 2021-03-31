'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Courses','rating', {
      type:Sequelize.FLOAT,
              allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    async (queryInterface, Sequelize) => {
      await queryInterface.changeColumn('Courses','rating', {
        type:Sequelize.INTEGER,
                allowNull: true
      });
    }
  }
};
