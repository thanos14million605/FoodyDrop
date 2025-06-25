const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const User = require('./../models/userModel');

exports.getAllActiveSessions = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+sessions');

    if (!user) {
        return next(new AppError('User belonging to this token does not exist.', 401));
    }

    res.status(200).json({
        status: 'success',
        results: user.sessions.length,
        data: {
            activeSessions: user.sessions.map(session => {
                return {
                    _id: session._id,
                    ip: session.ip,
                    browser: session.userAgent,
                    loginDate: session.createdAt
                }
            })
        }
    });
});

exports.getSession = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const user = await User.findById(req.user.id).select('+sessions');

    if (!user) {
        return next(new AppError('User belonging to this token does not exist.', 401));
    }

    const session = user.sessions.find((sess) => sess._id.toString() === id);
    if (!session) {
        return next(new AppError('Session not found', 404)); 
    }

    res.status(200).json({
        status: 'success',
        data: {
            _id: session._id,
            ip: session.ip,
            browser: session.userAgent,
            loginDate: session.createdAt,
            lastUpdated: session.updatedAt
        }
    });
});

exports.revokeSession = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const user = await User.findById(req.user.id).select('+sessions');

    if (!user) {
        return next(new AppError('User belonging to this token does not exist.', 401));
    }

    const session = user.sessions.find((sess) => sess._id.toString() === id);
    if (!session) {
        return next(new AppError('Session not found', 404)); 
    }

    user.sessions = user.sessions.filter((sess) => sess._id.toString() !== id);
    await user.save({ validateBeforeSave: false });

    res.status(204).json({
        status: 'success',
        data: null
    });
});

exports.revokeAllSessions = asyncHandler(async (req, res, next) => {
    const user = await User.findOne({ _id: req.user.id }).select('+sessions');

    if (!user) {
        return next(new AppError('Session not found.', 404));
    }

    if (user.sessions.length === 0) {
        return next(new AppError('No active session found', 404));
    }
    user.sessions = [];

    await user.save({ validateBeforeSave: false });
    console.log(user.sessions);

    res.status(204).json({
        status: 'success',
        data: null
    });
});
