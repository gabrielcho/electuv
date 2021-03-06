'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Review extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  Review.init({
    userid: DataTypes.INTEGER,
    rating: DataTypes.FLOAT,
    anonymous: DataTypes.BOOLEAN,
    courseid: DataTypes.INTEGER,
    author: DataTypes.STRING,
    title: DataTypes.STRING,
    teacher: DataTypes.STRING,
    period: DataTypes.STRING,
    content: DataTypes.TEXT,
    votes: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Review',
  });
  return Review;
};