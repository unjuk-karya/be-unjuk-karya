const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { ValidationError } = require('../../../utils/responseHandler');

const createStorage = (uploadPath) => {
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const extension = path.extname(file.originalname).toLowerCase();
      
      const uniqueId = crypto.randomBytes(6).toString('hex');
      const timestamp = Date.now().toString().slice(-10); 
      
      const uniqueFilename = `${timestamp}-${uniqueId}${extension}`;
      cb(null, uniqueFilename);
    }
  });
};

const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  
  cb(new ValidationError({
    image: ["Only image files (jpg, jpeg, png) are allowed!"]
  }));
};

const createUpload = (uploadPath = './public/uploads/') => {
  const multerInstance = multer({
    storage: createStorage(uploadPath),
    limits: { fileSize: 5000000 }, 
    fileFilter: fileFilter
  });

  return {
    single: (fieldName) => {
      return (req, res, next) => {
        multerInstance.single(fieldName)(req, res, (err) => {
          if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
              return next(new ValidationError({
                image: ["Image size should not exceed 5MB"]
              }));
            }
            if (err.code === 'LIMIT_UNEXPECTED_FILE') {
              return next(new ValidationError({
                image: ["Only one file is allowed"]
              }));
            }
            return next(new ValidationError({
              image: ["Error uploading file"]
            }));
          } else if (err) {
            return next(err);
          }
          next();
        });
      };
    }
  };
};

module.exports = createUpload;