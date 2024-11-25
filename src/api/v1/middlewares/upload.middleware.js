const multer = require('multer');
const path = require('path');
const { ValidationError } = require('../../../utils/responseHandler');

const storage = multer.diskStorage({
 destination: './uploads/',
 filename: (req, file, cb) => {
   cb(null, `${Date.now()}-${file.originalname}`);
 }
});

const fileFilter = (req, file, cb) => {
 const filetypes = /jpeg|jpg|png|gif/;
 const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
 const mimetype = filetypes.test(file.mimetype);

 if (extname && mimetype) {
   return cb(null, true);
 }
 
 cb(new ValidationError({
   image: ["Only image files (jpg, jpeg, png, gif) are allowed!"]
 }));
};

const upload = multer({
 storage: storage,
 limits: { fileSize: 5000000 }, 
 fileFilter: fileFilter
});

module.exports = upload;