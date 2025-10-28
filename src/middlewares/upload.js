const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { ensureDir } = require('../utils/fileHelper');

// 允许的图片 MIME 类型
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
];

// 最大文件大小 (5MB)
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024;

/**
 * 配置存储
 */
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    // 按日期组织目录: uploads/media/YYYY/MM/
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    const uploadPath = path.join(
      process.cwd(),
      process.env.UPLOAD_PATH || 'uploads',
      'media',
      String(year),
      month
    );

    try {
      await ensureDir(uploadPath);
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名: timestamp-uuid.ext
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${uuidv4()}${ext}`;
    
    // 将原始文件名保存到 req 对象中，供后续使用
    // 使用 Buffer 正确处理中文编码
    if (file.originalname) {
      req.originalFilename = Buffer.from(file.originalname, 'latin1').toString('utf8');
    }
    
    cb(null, filename);
  }
});

/**
 * 文件过滤器
 */
const fileFilter = (req, file, cb) => {
  // 检查 MIME 类型
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      new Error(`不支持的文件类型: ${file.mimetype}。仅支持 ${ALLOWED_MIME_TYPES.join(', ')}`),
      false
    );
  }

  // 检查文件扩展名
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  
  if (!allowedExts.includes(ext)) {
    return cb(
      new Error(`不支持的文件扩展名: ${ext}。仅支持 ${allowedExts.join(', ')}`),
      false
    );
  }

  cb(null, true);
};

/**
 * Multer 配置
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10 // 单次请求最多10个文件
  }
});

/**
 * 单文件上传中间件
 */
const uploadSingle = upload.single('file');

/**
 * 多文件上传中间件
 * @param {Number} maxCount - 最大文件数量
 */
const uploadMultiple = (maxCount = 10) => {
  return upload.array('files', maxCount);
};

/**
 * 上传错误处理中间件
 */
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer 错误
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        code: 400,
        message: `文件大小超过限制，最大允许 ${MAX_FILE_SIZE / 1024 / 1024}MB`
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        code: 400,
        message: '上传文件数量超过限制'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        code: 400,
        message: '上传了未预期的文件字段'
      });
    }
    
    return res.status(400).json({
      code: 400,
      message: `文件上传错误: ${err.message}`
    });
  }

  if (err) {
    // 自定义错误（如文件类型不支持）
    return res.status(400).json({
      code: 400,
      message: err.message
    });
  }

  next();
};

/**
 * 验证上传文件是否存在
 */
const validateFileExists = (req, res, next) => {
  if (!req.file && !req.files) {
    return res.status(400).json({
      code: 400,
      message: '请选择要上传的文件'
    });
  }
  next();
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  handleUploadError,
  validateFileExists,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE
};
