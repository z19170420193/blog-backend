const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

/**
 * 压缩和优化图片
 * @param {String} inputPath - 输入文件路径
 * @param {String} outputPath - 输出文件路径
 * @param {Object} options - 压缩选项
 * @returns {Object} - 图片元数据
 */
async function optimizeImage(inputPath, outputPath, options = {}) {
  const { width = 1920, quality = 85 } = options;
  
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    // 根据图片格式选择优化策略
    let pipeline = image;
    
    // 如果图片宽度超过限制，进行缩放
    if (metadata.width > width) {
      pipeline = pipeline.resize(width, null, { 
        withoutEnlargement: true,
        fit: 'inside'
      });
    }
    
    // 根据原始格式进行压缩
    switch (metadata.format) {
      case 'jpeg':
      case 'jpg':
        pipeline = pipeline.jpeg({ quality, progressive: true });
        break;
      case 'png':
        pipeline = pipeline.png({ quality, compressionLevel: 9 });
        break;
      case 'webp':
        pipeline = pipeline.webp({ quality });
        break;
      default:
        pipeline = pipeline.jpeg({ quality });
    }
    
    await pipeline.toFile(outputPath);
    
    // 如果压缩后的文件更大，使用原文件
    const originalSize = (await fs.stat(inputPath)).size;
    const compressedSize = (await fs.stat(outputPath)).size;
    
    if (compressedSize > originalSize) {
      await fs.unlink(outputPath);
      await fs.copyFile(inputPath, outputPath);
    }
    
    return metadata;
  } catch (error) {
    throw new Error(`图片优化失败: ${error.message}`);
  }
}

/**
 * 获取图片尺寸
 * @param {String} filePath - 文件路径
 * @returns {Object} - { width, height }
 */
async function getImageSize(filePath) {
  try {
    const metadata = await sharp(filePath).metadata();
    return {
      width: metadata.width,
      height: metadata.height
    };
  } catch (error) {
    return { width: null, height: null };
  }
}

/**
 * 删除文件
 * @param {String} filePath - 文件路径
 */
async function deleteFile(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error('删除文件失败:', error.message);
  }
}

/**
 * 确保目录存在
 * @param {String} dirPath - 目录路径
 */
async function ensureDir(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * 格式化文件大小
 * @param {Number} bytes - 字节数
 * @returns {String} - 格式化后的大小
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

module.exports = {
  optimizeImage,
  getImageSize,
  deleteFile,
  ensureDir,
  formatFileSize
};
