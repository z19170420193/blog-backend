const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Moment = sequelize.define('Moment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [1, 1000] // 限制1-1000字符
      }
    },
    images: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      comment: '图片URL数组，最多9张'
    },
    location: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '位置信息'
    },
    visibility: {
      type: DataTypes.ENUM('public', 'private', 'friends'),
      defaultValue: 'public',
      comment: '可见性: public-公开, private-私密, friends-好友可见'
    },
    is_pinned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否置顶'
    },
    published_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '发布时间'
    }
  }, {
    tableName: 'moments',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['published_at'] },
      { fields: ['visibility'] },
      { fields: ['is_pinned'] }
    ],
    hooks: {
      beforeCreate: (moment) => {
        // 自动设置发布时间
        if (!moment.published_at) {
          moment.published_at = new Date();
        }
      }
    }
  });

  return Moment;
};
