const { sequelize } = require('../models');

/**
 * 检查并修复数据库字符集
 */
async function checkAndFixDatabaseEncoding() {
  try {
    console.log('=== 开始检查数据库字符集 ===');
    
    // 1. 检查数据库字符集
    const [dbResults] = await sequelize.query(
      `SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME 
       FROM INFORMATION_SCHEMA.SCHEMATA 
       WHERE SCHEMA_NAME = '${sequelize.config.database}'`
    );
    
    console.log('\n数据库字符集:', dbResults[0]);
    
    if (dbResults[0].DEFAULT_CHARACTER_SET_NAME !== 'utf8mb4') {
      console.warn('⚠️  数据库字符集不是 utf8mb4！');
      console.log('建议执行修复命令...');
    } else {
      console.log('✅ 数据库字符集正确 (utf8mb4)');
    }
    
    // 2. 检查表字符集
    const [tableResults] = await sequelize.query(
      `SELECT TABLE_NAME, TABLE_COLLATION 
       FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = '${sequelize.config.database}'`
    );
    
    console.log('\n表字符集检查:');
    tableResults.forEach(table => {
      const isUtf8mb4 = table.TABLE_COLLATION.startsWith('utf8mb4');
      console.log(`  ${isUtf8mb4 ? '✅' : '❌'} ${table.TABLE_NAME}: ${table.TABLE_COLLATION}`);
    });
    
    // 3. 检查 media 表的字段
    const [columnResults] = await sequelize.query(
      `SELECT COLUMN_NAME, CHARACTER_SET_NAME, COLLATION_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = '${sequelize.config.database}' 
       AND TABLE_NAME = 'media' 
       AND CHARACTER_SET_NAME IS NOT NULL`
    );
    
    console.log('\nmedia 表字段字符集:');
    columnResults.forEach(col => {
      const isUtf8mb4 = col.CHARACTER_SET_NAME === 'utf8mb4';
      console.log(`  ${isUtf8mb4 ? '✅' : '❌'} ${col.COLUMN_NAME}: ${col.CHARACTER_SET_NAME}`);
    });
    
    console.log('\n=== 检查完成 ===\n');
    
    return {
      database: dbResults[0],
      tables: tableResults,
      mediaColumns: columnResults
    };
  } catch (error) {
    console.error('检查失败:', error.message);
    throw error;
  }
}

/**
 * 自动修复数据库和表的字符集
 */
async function fixDatabaseEncoding() {
  try {
    console.log('=== 开始修复数据库字符集 ===\n');
    
    const dbName = sequelize.config.database;
    
    // 1. 修改数据库字符集
    console.log('1. 修改数据库字符集...');
    await sequelize.query(
      `ALTER DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log('✅ 数据库字符集已修改为 utf8mb4\n');
    
    // 2. 获取所有表名
    const [tables] = await sequelize.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = '${dbName}'`
    );
    
    // 3. 修改每个表的字符集
    console.log('2. 修改表字符集...');
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      await sequelize.query(
        `ALTER TABLE \`${tableName}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
      console.log(`  ✅ ${tableName}`);
    }
    
    console.log('\n=== 修复完成 ===\n');
    console.log('请重新检查字符集设置。');
    
  } catch (error) {
    console.error('修复失败:', error.message);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  (async () => {
    try {
      const args = process.argv.slice(2);
      
      if (args.includes('--fix')) {
        // 执行修复
        await fixDatabaseEncoding();
        await checkAndFixDatabaseEncoding();
      } else {
        // 只检查
        await checkAndFixDatabaseEncoding();
        console.log('\n💡 提示: 如需修复，请运行: node checkEncoding.js --fix\n');
      }
      
      process.exit(0);
    } catch (error) {
      console.error('执行失败:', error);
      process.exit(1);
    }
  })();
}

module.exports = {
  checkAndFixDatabaseEncoding,
  fixDatabaseEncoding
};