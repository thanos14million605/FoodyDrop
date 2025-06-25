const User = require('./../models/userModel');
const asyncHandler = require('./../utils/asyncHandler');
const AppError = require('./../utils/AppError');
const { 
    applyFieldLimiting,
    applyFiltering,
    applySorting,
    applyPagination
} = require('./../utils/apiFeatures');
const cloudinary = require('./../utils/cloudinary');
const streamifier = require('streamifier');

const datedOfJoining = (user) => `${String(user.createdAt?.getDate()).padStart(2, '0')}-${String(user.createdAt?.getMonth() + 1).padStart(2, '0')}-${String(user.createdAt.getFullYear()).padStart(2, '0')}`;

exports.createUser = asyncHandler(async (req, res, next) => {
    const { name, email, password, confirmPassword, role, imageBase64} = req.body;

    if (!role) {
        return next(new AppError('Please role must be specified.', 400));
    }

    const newUser = await User.create({
        name,
        email,
        password,
        confirmPassword,
        role,
        isEmailVerified: true
    });

    if (!imageBase64) {

        return res.status(201).json({
            status: 'success',
            data: {
                userName: newUser.name,
                userEmail: newUser.email,
            }
        });
    }

    const result = await cloudinary.uploader.upload(imageBase64, {
        public_id: `user-profile-photos/${req.user.id}`,
        overwrite: true, // ensure same ID is reused
        transformation: [
            { quality: 'auto'},
            { fetch_format: 'auto'}
        ]
    });

    newUser.photoUrl = result.secure_url;
    newUser.photoPublicId = result.public_id;

    await newUser.save({ validateBeforeSave: false });

    res.status(201).json({
        status: 'success',
        data: {
            userName: newUser.name,
            userEmail: newUser.email,
        }
    });
});

exports.getAllUsers = asyncHandler(async (req, res, next) => {
    let query = User.find();

    query = applyFiltering(query, req.query);
    query = applyFieldLimiting(query, req.query);
    query = applySorting(query, req.query);
    query = applyPagination(query, req.query);

    const users = await query.select('+_id +name +email +role +isActive +isEmailVerified');; // I may populate the sessions here also.
    if (users.length === 0) {
        return next(new AppError('No matching records', 200));
    }

    res.status(200).json({
        status: 'success',
        results: users.length,
        data: {
            users
        }
    });
    
});

exports.getUser = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return next(new AppError('User not found', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            joinedOn: datedOfJoining(user)
        }
    });
});

exports.updateUser = asyncHandler(async (req, res, next) => {
    const { role } = req.body;
    const updatedUser = await User.findByIdAndUpdate(req.params.id, { role }, {
        new: true,
        runValidators: true
    });

    if (!updatedUser) {
        return next(new AppError('User not found', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    });
});

exports.deleteUser = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new AppError('User not found', 404));
    }

    user.isActive = false;
    await user.save({ validateBeforeSave: false });

    res.status(204).json({
        status: 'success',
        data: null
    });
});

exports.deleteMe = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+isActive');

    if (!user) {
        return next(new AppError('User not found.', 404));
    }

    user.isActive = false;
    await user.save({ validateBeforeSave: false });

    res.status(204).json({
        status: 'success',
        data: null
    });
});

exports.updateMe = asyncHandler(async (req, res, next) => {
    const allowedFields = ['name', 'photo'];
    const updates = {};

    allowedFields.forEach((allowedField) => {
        if (req.body[allowedField]) {
            updates[allowedField] = req.body[allowedField];
        }
    });

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updates, {
        new: true,
        runValidators: true
    });

    if (!updatedUser) {
        return next(new AppError('User not found.', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    });
});

exports.getMe = asyncHandler(async (req, res, next) => {
    const me = await User.findOne({ _id: req.user.id });
    if (!me) {
        return next(new AppError('User not found.', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            _id: me._id,
            name: me.name,
            email: me.email,
            joinedOn: datedOfJoining(me)
        }
    });
});

exports.updateProfileImage = asyncHandler(async (req, res, next) => {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
        return next(new AppError('Image is required.', 400));
    }
    const user = await User.findById(req.user.id).select('+photoUrl +photoPublicId');
    if (!user) {
        return next(new AppError('User not found', 404));
    }

    // Check if user has already uploaded photo.
    if (user.photoPublicId) {
        await cloudinary.uploader.destroy(user.photoPublicId);
    }

    const result = await cloudinary.uploader.upload(imageBase64, {
        public_id: `user-profile-photos/${req.user.id}`,
        overwrite: true, // ensure same ID is reused
        transformation: [
            { quality: 'auto'},
            { fetch_format: 'auto'}
        ]
    });

    user.photoUrl = result.secure_url;
    user.photoPublicId = result.public_id;

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
        status: 'success',
        data: {
            user
        }
    });
});

exports.deleteProfileImage = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+photoUrl +photoPublicId');

    if (!user) {
        return next(new AppError('User not found', 404));
    }

    if (!user.photoPublicId) {
        return next(new AppError('You don\'t set a profile photo yet', 404));
    }

    await cloudinary.uploader.destroy(user.photoPublicId);

    user.photoUrl = undefined;
    user.photoPublicId = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(204).json({
        status: 'success',
        data: null
    });
});

exports.updateProfileImageWithMulterAndStreams = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+photoUrl +photoPublicId');

    if (!req.file || !req.file.buffer) {
        return next(new AppError('Please upload a profile photo image.', 400));
    }

    console.log(req.file);

    if (req.file.size > Math.round((3 * 1024 * 1024))) {
        return next(new AppError('Image size is too large, 3MB or less.', 400));
    }

    if (!user) {
        return next(new AppError('User not found.', 404));
    }

    if (user.photoPublicId) {
        await cloudinary.uploader.destroy(user.photoPublicId);
    }

    // Convert buffer to stream and upload.
    const streamUpload = (buffer) => {
        return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    // resource_type: 'video', // This must be specified if uploaded
                    // file is an audio or video.
                    // Even for image, it will be a good practice for me
                    // to specify the resource_type as image
                    folder: 'user-profile-photos',
                    public_id: `${req.user.id}-${Date.now()}`,
                    overwrite: true,
                    
                },
                (err, result) => {
                    if (result) resolve(result);

                    else reject(err);
                }
            );

            // console.log(buffer);
            // console.log(stream);
    
            streamifier.createReadStream(buffer).pipe(stream);
        });

    };

    // Save image URL and public id to MongoDB
    let result;
    try {
        result = await streamUpload(req.file.buffer);
    } catch (err) {
        console.error('Cloudinary Upload Error:', err);
        // Send email to developer if there is cloudinary error.
        // In a production app, I will implement that here.

        // Generic fallback
        return next(new AppError('Image upload failed. File may be too large or corrupted.', 400));
    }
    
    console.log('Result', result);

    user.photoUrl = result.secure_url;
    user.photoPublicId = result.public_id;

    await user.save({ validateBeforeSave: false });

    // Send response.
    res.status(200).json({
        status: 'success',
        data: {
            user
        }
    });
});


