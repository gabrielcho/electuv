'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Reviews','userid', {
      type:Sequelize.INTEGER,
              allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    async (queryInterface, Sequelize) => {
      await queryInterface.changeColumn('Reviews','userid', {
        type:Sequelize.STRING,
                allowNull: true
      });
    }
  }
};
