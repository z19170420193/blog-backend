const { sequelize } = require('../config/database');

// 导入所有模型
const User = require('./User')(sequelize);
const Category = require('./Category')(sequelize);
const Tag = require('./Tag')(sequelize);
const Article = require('./Article')(sequelize);
const Comment = require('./Comment')(sequelize);
const Media = require('./Media')(sequelize);

// 定义模型关联关系

// User - Article (一对多)
User.hasMany(Article, { foreignKey: 'author_id', as: 'articles' });
Article.belongsTo(User, { foreignKey: 'author_id', as: 'author' });

// User - Media (一对多)
User.hasMany(Media, { foreignKey: 'uploader_id', as: 'media' });
Media.belongsTo(User, { foreignKey: 'uploader_id', as: 'uploader' });

// Category - Article (一对多)
Category.hasMany(Article, { foreignKey: 'category_id', as: 'articles' });
Article.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// Article - Tag (多对多)
Article.belongsToMany(Tag, { 
  through: 'article_tags',
  foreignKey: 'article_id',
  otherKey: 'tag_id',
  as: 'tags'
});
Tag.belongsToMany(Article, { 
  through: 'article_tags',
  foreignKey: 'tag_id',
  otherKey: 'article_id',
  as: 'articles'
});

// Article - Comment (一对多)
Article.hasMany(Comment, { foreignKey: 'article_id', as: 'comments' });
Comment.belongsTo(Article, { foreignKey: 'article_id', as: 'article' });

// Comment - User (多对一，可选)
User.hasMany(Comment, { foreignKey: 'user_id', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Comment - Comment (自关联，父子评论)
Comment.hasMany(Comment, { foreignKey: 'parent_id', as: 'replies' });
Comment.belongsTo(Comment, { foreignKey: 'parent_id', as: 'parent' });

// 导出所有模型
module.exports = {
  sequelize,
  User,
  Category,
  Tag,
  Article,
  Comment,
  Media
};
