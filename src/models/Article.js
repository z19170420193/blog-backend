const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Article = sequelize.define('Article', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    content: {
      type: DataTypes.TEXT('long'),
      allowNull: false
    },
    cover_image: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    author_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('draft', 'published'),
      defaultValue: 'draft'
    },
    views: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    is_top: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    published_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'articles',
    indexes: [
      { fields: ['author_id'] },
      { fields: ['category_id'] },
      { fields: ['status'] },
      { fields: ['published_at'] },
      { fields: ['is_top'] }
    ]
  });

  return Article;
};
