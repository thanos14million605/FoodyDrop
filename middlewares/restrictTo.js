const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const User = require('./../models/userModel');

exports.restrictTo = (...roles) => {
    return async (req, res, next) => {
        const user = await User.findById(req.user.id).select('+role');
        if (!roles.includes(user.role)) {
            return next(new AppError('Forbidden. Access denied.', 403));
        } 
        
        next();
    }
};
