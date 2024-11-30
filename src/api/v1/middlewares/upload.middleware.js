const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const { ValidationError } = require('../../../utils/responseHandler');
const bucket = require('../../../config/gcs'); 

const multerStorage = multer.memoryStorage();

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

const uploadToGCS = async (file) => {
  const uniqueId = crypto.randomBytes(6).toString('hex');
  const timestamp = Date.now().toString();
  const fileName = `${timestamp}-${uniqueId}${path.extname(file.originalname).toLowerCase()}`;

  const blob = bucket.file(`posts/${fileName}`);
  const stream = blob.createWriteStream({
    resumable: false,
    contentType: file.mimetype,
    predefinedAcl: 'publicRead', 
  });

  return new Promise((resolve, reject) => {
    stream.on('error', (err) => reject(err));
    stream.on('finish', () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/posts/${fileName}`;
      resolve(publicUrl);
    });

    stream.end(file.buffer);
  });
};

const createUpload = (fieldName , pathResolver) => {
  const multerInstance = multer({
    storage: multerStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, 
    fileFilter,
  });

  return [
    multerInstance.single(fieldName), 
    async (req, res, next) => {
      if (!req.file) return next();

      try {
        const resolvedPath =
          typeof pathResolver === 'function' ? pathResolver(req) : pathResolver;

        const uniqueId = crypto.randomBytes(6).toString('hex');
        const timestamp = Date.now().toString();
        const fileName = `${timestamp}-${uniqueId}${path.extname(req.file.originalname).toLowerCase()}`;

        const filePath = `${resolvedPath}${fileName}`;
        const blob = bucket.file(filePath);
        const stream = blob.createWriteStream({
          resumable: false,
          contentType: req.file.mimetype,
          predefinedAcl: 'publicRead',
        });

        await new Promise((resolve, reject) => {
          stream.on('error', (err) => reject(err));
          stream.on('finish', () => {
            req.file.cloudStoragePublicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
            resolve();
          });

          stream.end(req.file.buffer);
        });

        next();
      } catch (error) {
        next(error);
      }
    },
  ];
};

module.exports = createUpload;