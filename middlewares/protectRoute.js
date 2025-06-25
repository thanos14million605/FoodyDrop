const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const User = require('./../models/userModel');
const { verifyToken } = require('./../utils/jwt');

exports.protectRoute = asyncHandler(async (req, res, next) => {
    let token;
    if (req.headers?.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
        token = req.cookies.accessToken;
    }

    if (!token) {
        return next(new AppError('Token missing. Please log again.', 401));
    }

    const decoded = await verifyToken(token, process.env.JWT_ACCESS_SECRET);

    const user = await User.findById(decoded.id).select('+passwordChangedAt +isActive');

    if (!user) {
        return next(new AppError('User belonging to this token does not exist.', 401));
    }

    if (!user.isActive) {
        return next(new AppError('Sorry you are not an active user.', 401));
    }
    
    if (user.passwordChangedAt && Date.parse(user.passwordChangedAt) > decoded.iat * 1000) {
        return next(new AppError('User recently changed password. Please log in again.', 401));
    }

    req.user = user;

    next();
});

