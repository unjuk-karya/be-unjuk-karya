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

const createUpload = (fieldConfig, folderPath) => {
  const multerInstance = multer({
    storage: multerStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter,
  });

  const isMultiField = Array.isArray(fieldConfig);
  const multerMiddleware = isMultiField
    ? multerInstance.fields(fieldConfig.map(field => ({ name: field.name, maxCount: 1 })))
    : multerInstance.single(fieldConfig);

  return [
    multerMiddleware,
    async (req, res, next) => {
      if (!req.file && !req.files) return next();

      try {
        if (isMultiField) {
          for (const fieldName in req.files) {
            const file = req.files[fieldName][0];
            const field = fieldConfig.find(f => f.name === fieldName);

            const uniqueId = crypto.randomBytes(6).toString('hex');
            const timestamp = Date.now().toString();
            const fileName = `${timestamp}-${uniqueId}${path.extname(file.originalname).toLowerCase()}`;

            const filePath = `${field.path}${fileName}`;
            const blob = bucket.file(filePath);
            const stream = blob.createWriteStream({
              resumable: false,
              contentType: file.mimetype,
              predefinedAcl: 'publicRead',
            });

            await new Promise((resolve, reject) => {
              stream.on('error', (err) => reject(err));
              stream.on('finish', () => {
                file.cloudStoragePublicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
                resolve();
              });

              stream.end(file.buffer);
            });
          }
        } else {
          const file = req.file;
          const uniqueId = crypto.randomBytes(6).toString('hex');
          const timestamp = Date.now().toString();
          const fileName = `${timestamp}-${uniqueId}${path.extname(file.originalname).toLowerCase()}`;

          const filePath = `${folderPath}${fileName}`;
          const blob = bucket.file(filePath);
          const stream = blob.createWriteStream({
            resumable: false,
            contentType: file.mimetype,
            predefinedAcl: 'publicRead',
          });

          await new Promise((resolve, reject) => {
            stream.on('error', (err) => reject(err));
            stream.on('finish', () => {
              file.cloudStoragePublicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
              resolve();
            });

            stream.end(file.buffer);
          });
        }

        next();
      } catch (error) {
        next(error);
      }
    },
  ];
};

module.exports = createUpload;