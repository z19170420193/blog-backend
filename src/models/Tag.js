const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Tag = sequelize.define('Tag', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    color: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: '#409EFF'
    }
  }, {
    tableName: 'tags'
  });

  return Tag;
};
