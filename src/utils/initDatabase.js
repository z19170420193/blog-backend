/**
 * 数据库初始化脚本
 * 用于创建数据库表结构和初始化数据
 */

require('dotenv').config();
const { sequelize, User, Category, Tag, Article, Comment, Media } = require('../models');

/**
 * 创建初始管理员用户
 */
async function createAdminUser() {
  try {
    // 检查是否已存在管理员
    const existingAdmin = await User.findOne({ where: { role: 'admin' } });
    
    if (existingAdmin) {
      console.log('⚠️  管理员用户已存在，跳过创建');
      return existingAdmin;
    }

    // 创建管理员
    const admin = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123', // 将被自动加密
      role: 'admin',
      avatar: null
    });

    console.log('✅ 管理员用户创建成功');
    console.log('   用户名: admin');
    console.log('   邮箱: admin@example.com');
    console.log('   密码: admin123');
    console.log('   ⚠️  请在生产环境中立即修改密码！');
    
    return admin;
  } catch (error) {
    console.error('❌ 创建管理员用户失败:', error.message);
    throw error;
  }
}

/**
 * 创建示例分类
 */
async function createSampleCategories() {
  try {
    const existingCount = await Category.count();
    
    if (existingCount > 0) {
      console.log('⚠️  分类已存在，跳过创建');
      return;
    }

    const categories = await Category.bulkCreate([
      { name: '技术', description: '技术相关文章', sort_order: 1 },
      { name: '生活', description: '生活随笔', sort_order: 2 },
      { name: '随笔', description: '个人随笔', sort_order: 3 }
    ]);

    console.log(`✅ 创建了 ${categories.length} 个示例分类`);
    return categories;
  } catch (error) {
    console.error('❌ 创建示例分类失败:', error.message);
    throw error;
  }
}

/**
 * 创建示例标签
 */
async function createSampleTags() {
  try {
    const existingCount = await Tag.count();
    
    if (existingCount > 0) {
      console.log('⚠️  标签已存在，跳过创建');
      return;
    }

    const tags = await Tag.bulkCreate([
      { name: 'JavaScript', color: '#F7DF1E' },
      { name: 'Node.js', color: '#339933' },
      { name: 'Vue.js', color: '#4FC08D' },
      { name: 'React', color: '#61DAFB' },
      { name: 'TypeScript', color: '#3178C6' },
      { name: 'MySQL', color: '#4479A1' }
    ]);

    console.log(`✅ 创建了 ${tags.length} 个示例标签`);
    return tags;
  } catch (error) {
    console.error('❌ 创建示例标签失败:', error.message);
    throw error;
  }
}

/**
 * 创建示例文章
 */
async function createSampleArticle(admin, categories, tags) {
  try {
    const existingCount = await Article.count();
    
    if (existingCount > 0) {
      console.log('⚠️  文章已存在，跳过创建');
      return;
    }

    const article = await Article.create({
      title: '欢迎使用个人博客系统',
      summary: '这是一个基于 Node.js + Vue 3 构建的现代化个人博客系统',
      content: `# 欢迎使用个人博客系统

这是一个功能完善的个人博客系统，具有以下特性：

## 核心功能
- ✅ 文章发布和管理
- ✅ 分类和标签系统
- ✅ 评论互动
- ✅ 媒体文件管理
- ✅ 用户认证和权限控制

## 技术栈
- **后端**: Node.js + Express + Sequelize + MySQL
- **前端**: Vue 3 + TypeScript + Vite + Element Plus

开始您的博客之旅吧！`,
      author_id: admin.id,
      category_id: categories && categories.length > 0 ? categories[0].id : null,
      status: 'published',
      is_top: true,
      published_at: new Date()
    });

    // 关联标签
    if (tags && tags.length > 0) {
      await article.setTags([tags[0], tags[1]]);
    }

    console.log('✅ 创建了示例文章');
    return article;
  } catch (error) {
    console.error('❌ 创建示例文章失败:', error.message);
    throw error;
  }
}

/**
 * 主初始化函数
 */
async function initDatabase() {
  console.log('\n🚀 开始初始化数据库...\n');

  try {
    // 1. 测试数据库连接
    console.log('📡 测试数据库连接...');
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功\n');

    // 2. 同步数据库表结构
    console.log('📊 同步数据库表结构...');
    await sequelize.sync({ force: false, alter: false });
    console.log('✅ 数据库表结构同步完成\n');

    // 3. 创建初始数据
    console.log('📝 创建初始数据...\n');
    
    const admin = await createAdminUser();
    const categories = await createSampleCategories();
    const tags = await createSampleTags();
    await createSampleArticle(admin, categories, tags);

    console.log('\n✨ 数据库初始化完成！\n');
    console.log('📌 下一步操作:');
    console.log('   1. 运行 npm run dev 启动服务器');
    console.log('   2. 使用 admin@example.com / admin123 登录');
    console.log('   3. 修改管理员密码\n');

  } catch (error) {
    console.error('\n❌ 数据库初始化失败:');
    console.error('   错误信息:', error.message);
    
    if (error.original) {
      console.error('   详细错误:', error.original.message);
      
      // 常见错误提示
      if (error.original.code === 'ER_ACCESS_DENIED_ERROR') {
        console.error('\n💡 解决方案:');
        console.error('   - 检查 .env 文件中的数据库用户名和密码');
        console.error('   - 确保 MySQL 用户有足够的权限');
      } else if (error.original.code === 'ER_BAD_DB_ERROR') {
        console.error('\n💡 解决方案:');
        console.error('   - 数据库不存在，请先创建数据库:');
        console.error('   - mysql -u root -p');
        console.error('   - CREATE DATABASE blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
        console.error('   - CREATE USER \'blog\'@\'localhost\' IDENTIFIED BY \'123456\';');
        console.error('   - GRANT ALL PRIVILEGES ON blog.* TO \'blog\'@\'localhost\';');
        console.error('   - FLUSH PRIVILEGES;');
      } else if (error.original.code === 'ECONNREFUSED') {
        console.error('\n💡 解决方案:');
        console.error('   - 确保 MySQL 服务已启动');
        console.error('   - 检查数据库主机和端口配置');
      }
    }
    
    process.exit(1);
  } finally {
    // 关闭数据库连接
    await sequelize.close();
  }
}

// 执行初始化
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase };
