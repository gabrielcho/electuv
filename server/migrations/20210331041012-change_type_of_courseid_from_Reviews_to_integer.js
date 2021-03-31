'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Reviews','courseid', {
      type:Sequelize.INTEGER,
              allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    async (queryInterface, Sequelize) => {
      await queryInterface.changeColumn('Reviews','courseid', {
        type:Sequelize.STRING,
                allowNull: true
      });
    }
  }
};
