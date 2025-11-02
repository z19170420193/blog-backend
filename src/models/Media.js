const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Media = sequelize.define('Media', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    filename: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    stored_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    file_path: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    file_url: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    file_size: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    mime_type: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    width: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    uploader_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    usage_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    storage_type: {
      type: DataTypes.ENUM('local', 'oss'),
      defaultValue: 'local'
    }
  }, {
    tableName: 'media',
    indexes: [
      { fields: ['uploader_id'] },
      { fields: ['mime_type'] },
      { fields: ['storage_type'] },
      { fields: ['created_at'] }
    ]
  });

  return Media;
};
