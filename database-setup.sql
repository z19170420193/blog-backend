-- ========================================
-- 个人博客系统 - 数据库初始化脚本
-- ========================================

-- 1. 创建数据库
CREATE DATABASE IF NOT EXISTS blog 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

-- 2. 创建数据库用户
CREATE USER IF NOT EXISTS 'blog'@'localhost' IDENTIFIED BY '123456';

-- 3. 授予权限
GRANT ALL PRIVILEGES ON blog.* TO 'blog'@'localhost';

-- 4. 刷新权限
FLUSH PRIVILEGES;

-- 5. 使用数据库
USE blog;

-- 查看当前数据库
SELECT DATABASE();

-- ========================================
-- 说明
-- ========================================
-- 数据库名: blog
-- 用户名: blog
-- 密码: 123456
-- 字符集: utf8mb4
-- 排序规则: utf8mb4_unicode_ci
--
-- 执行方式:
-- mysql -u root -p < database-setup.sql
-- 
-- 或者在 MySQL 命令行中:
-- source C:/path/to/database-setup.sql
-- ========================================
