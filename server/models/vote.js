'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Vote extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  Vote.init({
    reviewid: {type: DataTypes.INTEGER, allowNull: false},
    userid: {type:  DataTypes.INTEGER, allowNull: false},
    vote: {type: DataTypes.INTEGER, allowNull: false}
  }, {
    sequelize,
    modelName: 'Vote',
  });
  return Vote;
};