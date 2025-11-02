require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    // 确保使用 UTF8MB4 字符集，支持中文和 emoji
    dialectOptions: {
      charset: 'utf8mb4'
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    timezone: '+08:00',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: true, // 使用下划线命名
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      // 默认字符集设置
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    },
    hooks: {
      // 确保池中每个连接都设置为 utf8mb4
      afterConnect: (connection) => {
        return new Promise((resolve, reject) => {
          connection.query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci", (err) => {
            if (err) return reject(err);
            resolve();
          });
        });
      }
    }
  }
);

// 测试数据库连接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    // 强制设置字符集
    await sequelize.query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, testConnection };
