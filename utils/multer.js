const multer = require('multer');
const path = require('path');
const AppError = require('./../utils/AppError');


// Store file in memory and not disk
const storage = multer.memoryStorage();


// Allow only specific mimeTypes and extensions
const allowedMimeTypes = [
    'image/jpeg', 'image/jpg', 'image/png',
    // 'video/mp4', 'video/quicktime', 'video/x-matroska', // Videos
    // 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg' // audio
];
  
const allowedExtentions = [
    '.jpeg', '.jpg', '.png',
    // '.mp4', '.mov', '.mkv', // Video extensions should for example
    // I am writing an API where people can watch movies
    // '.mp3', '.wav', '.ogg'
];

// File filter
const fileFilter = (req, file, cb) => {

    const ext = path.extname(file.originalname).toLowerCase();

    if (
        allowedMimeTypes.includes(file.mimetype) && 
        allowedExtentions.includes(ext)
    ) {
        cb(null, true);
    } else {
        cb(new AppError('Only JPEG, JPG and PNG images are allowed.', 400), false);
    }
};

// Export upload middleware 
const upload = multer({ 
    storage, 
    fileFilter
});

module.exports = upload;