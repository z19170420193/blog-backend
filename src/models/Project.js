const { DataTypes } = require('sequelize');

/**
 * Project 模型 - 项目展示
 * 用于展示个人技术项目作品集
 */
module.exports = (sequelize) => {
  const Project = sequelize.define('Project', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '项目ID'
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '项目名称',
      validate: {
        notEmpty: { msg: '项目名称不能为空' },
        len: { args: [1, 200], msg: '项目名称长度应在1-200字符之间' }
      }
    },
    subtitle: {
      type: DataTypes.STRING(300),
      allowNull: true,
      comment: '副标题/一句话介绍'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '项目简介',
      validate: {
        notEmpty: { msg: '项目简介不能为空' }
      }
    },
    content: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      comment: '详细介绍(Markdown格式)'
    },
    
    // 视觉元素
    cover_image: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '封面图URL'
    },
    images: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '项目截图数组(最多10张)',
      defaultValue: []
    },
    demo_video: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '演示视频URL'
    },
    
    // 项目信息
    tech_stack: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: '技术栈数组',
      defaultValue: [],
      validate: {
        isValidArray(value) {
          if (!Array.isArray(value)) {
            throw new Error('技术栈必须是数组格式');
          }
          if (value.length === 0) {
            throw new Error('至少需要一个技术栈');
          }
        }
      }
    },
    project_type: {
      type: DataTypes.ENUM('web', 'mobile', 'desktop', 'backend', 'fullstack', 'other'),
      allowNull: false,
      defaultValue: 'web',
      comment: '项目类型'
    },
    status: {
      type: DataTypes.ENUM('completed', 'in_progress', 'archived', 'draft'),
      allowNull: false,
      defaultValue: 'draft',
      comment: '项目状态'
    },
    
    // 链接
    github_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'GitHub仓库地址'
    },
    demo_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '在线演示地址'
    },
    documentation_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '文档地址'
    },
    
    // 时间与统计
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '开始日期'
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '结束日期'
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '开发周期(天)',
      validate: {
        min: 0
      }
    },
    team_size: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: '团队规模',
      validate: {
        min: 1
      }
    },
    
    // 展示控制
    is_featured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否精选'
    },
    is_open_source: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否开源'
    },
    display_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '显示顺序(数字越大越靠前)'
    },
    view_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '浏览量'
    },
    
    // 元数据
    author_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '作者ID',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '项目分类'
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '标签数组',
      defaultValue: []
    }
  }, {
    tableName: 'projects',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['author_id'] },
      { fields: ['status'] },
      { fields: ['is_featured'] },
      { fields: ['project_type'] },
      { fields: ['display_order'] },
      { fields: ['created_at'] }
    ],
    comment: '项目展示表'
  });

  return Project;
};
