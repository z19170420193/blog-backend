const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Message = sequelize.define('Message', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: '用户ID(登录用户)'
    },
    nickname: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '昵称'
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true
      },
      comment: '邮箱'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [1, 500]
      },
      comment: '留言内容'
    },
    mood: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: 'happy',
      comment: '心情: happy, sad, angry, excited, thinking'
    },
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '头像URL'
    },
    ip: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'IP地址'
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '地理位置'
    },
    browser: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '浏览器信息'
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
      comment: '状态: pending-待审核, approved-已通过, rejected-已拒绝'
    },
    reply_to_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'messages',
        key: 'id'
      },
      comment: '回复的留言ID'
    },
    likes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '点赞数'
    },
    color: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '卡片背景色'
    }
  }, {
    tableName: 'messages',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['status'] },
      { fields: ['reply_to_id'] },
      { fields: ['created_at'] }
    ]
  });

  return Message;
};
