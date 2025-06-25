const bcrypt = require('bcrypt');
const crypto = require('crypto');

const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const User = require('./../models/userModel');
const { sendEmail } = require("../utils/email");
const { sendEmailSendgrid } = require('./../utils/emailSendgrid');
const { generateOTP, generateAdmin2FAOTP }= require("../utils/otp");
const { signAccessToken, signRefreshToken, verifyToken } = require('../utils/jwt');

const mitigateTimingAttack = async () => {
    return bcrypt.hash(process.env.DUMMY_PASSWORD, 12);
};

exports.signup = asyncHandler(async (req, res, next) => {
    const { name, email, password, confirmPassword } = req.body;
    
    if (!name || !email || !password || !confirmPassword) {
        return next(new AppError('Please all fields are required.', 400));
    }

    const isExistingUser = await User.findOne({ email });
    if (isExistingUser) {
        await mitigateTimingAttack();
        return next(new AppError('Already registered email. Please log in.', 400));
    }

    const { otp, otpExpiresAt } = generateOTP();
    const newUser = await User.create({
        name,
        email,
        password,
        confirmPassword,
        otp,
        otpExpiresAt,
        isEmailVerified: false,
    });

    try {
        const subject = 'OTP Verification Code (Valid for 15 minutes)';
        const message = `Your OTP verification code is ${otp}`;

        await sendEmail({
            email,
            subject,
            message
        });

        return res.status(201).json({
            status: 'success',
            message: 'OTP has been sent to verify your email.'
        });

    } catch (err) {
        console.log('Error in sending signup OTP');
        console.log(err);

        newUser.otp = undefined;
        newUser.otpExpiresAt = undefined;

        await newUser.save({ validateBeforeSave: false });
        return next(new AppError('There was an error in sending OTP to your email. Do not create another account. OTP will be sent when server is back.', 500));
    }
});

exports.login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new AppError('Please provide both email and password.', 400));
    }

    const user = await User.findOne({ email }).select('+adminTwoFactorEmail +adminTwoFactorCode +adminTwoFactorCodeExpiresAt +password +isEmailVerified +sessions +role +lastLoginIP +lastLoginTimestamp +isActive');
    if (!user) {
        await mitigateTimingAttack();
        return next(new AppError('Invalid crendentials.', 401));
    }

    if (!user.isActive) {
        return next(new AppError('Invalid credentials.', 401));
    }

    const isMatch = await user.isPasswordCorrect(password, user.password);
    if (!isMatch) {
        return next(new AppError('Invalid credentials.', 401));
    }

    if (!user.isEmailVerified) {
        // todo: silently send email to user.
        const { otp, otpExpiresAt } = generateOTP();

        try {
            const verifyEmailURL = `${req.protocol}://${req.get('host')}/api/v1/users/verify-email`;
            const subject = 'Email Verification OTP';
            const message = `Dear ${user.name}, we have noticed that your are trying to log into your FoodyDrop account.\n
            However, your email is yet to be verified. Please click the link below and enter the OTP in order to have you
            email verified.\n\nYour OTP is ${otp}.\n\n${verifyEmailURL}`;

            user.otp = otp;
            user.otpExpiresAt = otpExpiresAt;
            await user.save({ validateBeforeSave: false });

            await sendEmail({
                email,
                subject,
                message
            });
        } catch (err) {
            console.log('Error in sending verify email OTP to a user who is attempting to login but email is not yet verified.');
            console.log(err);

            user.otp = undefined;
            user.otpExpiresAt = undefined;
            await user.save({ validateBeforeSave: false });

        }

        return next(new AppError('Invalid credentials. Please you may check your email for further instructions.', 401));
    }

    // if (user.role === 'admin') {
    //     const { adminTwoFactorCode,  adminTwoFactorCodeExpiresAt } = generateAdmin2FAOTP();
        
    //     try {
    //         const subject = '2FA Code (Valid for 5 minutes)'
    //         const message = `Your 2FA OTP is ${adminTwoFactorCode}`;
            
    //         user.adminTwoFactorCode = adminTwoFactorCode;
    //         user.adminTwoFactorCodeExpiresAt = adminTwoFactorCodeExpiresAt;

    //         await user.save({ validateBeforeSave: false });

    //         await sendEmailSendgrid({
    //             email: user.adminTwoFactorEmail,
    //             subject,
    //             message
    //         });

    //         return res.status(200).json({
    //             status: 'success',
    //             message: 'Two factor code has been sent to your 2FA email.'
    //         });

    //     } catch (err) {
    //         console.log('Error in sending admin 2FA code');
    //         console.log(err);

    //         user.adminTwoFactorCode = undefined;
    //         user.adminTwoFactorCodeExpiresAt = undefined;

    //         await user.save({ validateBeforeSave: false });

    //         return next(new AppError('There was error in sending 2FA code. Please try again.', 500));
    //     }
    // }

    if (user.sessions.length >= 5) {
        return next(new AppError('Sorry, you have reached the maximum number of active sessions.', 400));
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    user.lastLoginIP = req.ip;
    user.lastLoginTimestamp = Date.now();
    user.sessions.push({
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        refreshToken
    });

    await user.save({ validateBeforeSave: false });
    
    res.cookie('refreshToken', refreshToken, {
        maxAge: process.env.JWT_REFRESH_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'development' ? 'Lax' : 'strict',
        secure: process.env.NODE_ENV === 'production'
    });

    res.cookie('accessToken', accessToken, {
        maxAge: process.env.JWT_ACCESS_COOKIE_EXPIRES_IN * 60 * 1000,
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'development' ? 'Lax' : 'strict',
        secure: process.env.NODE_ENV === 'production'
    });

    res.status(200).json({
        status: 'success',
        accessToken,
        data: {
            _id: user._id,
            name: user.name,
            email: user.email,
        }
    });
});

exports.verifyAdmin2FACode = asyncHandler(async (req, res, next) => {
    const { adminTwoFactorCode, email, password } = req.body;

    if (!email || !adminTwoFactorCode || !password) {
        return next(new AppError('Please all fields are required.', 400));
    }

    const user = await User.findOne({ email }).select('+adminTwoFactorEmail +adminTwoFactorCode +adminTwoFactorCodeExpiresAt +password +sessions +lastLoginIP +lastLoginTimestamp');
    if (!user) {
        await mitigateTimingAttack();
        return next(new AppError('Something went wrong.', 500));
    }

    const isMatch = await user.isPasswordCorrect(password, user.password);
    if (!isMatch) {
        return next(new AppError('Invalid crendentials.', 401));
    }

    if (user.adminTwoFactorCode !== adminTwoFactorCode || Date.now() > user.adminTwoFactorCodeExpiresAt) {
        return next(new AppError('Invalid or expired OTP', 401));
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    user.lastLoginIP = req.ip;
    user.lastLoginTimestamp = Date.now();
    user.sessions.push({
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        refreshToken
    });

    res.cookie('refreshToken', refreshToken, {
        maxAge: process.env.JWT_REFRESH_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'development' ? 'Lax' : 'strict',
        secure: process.env.NODE_ENV === 'production'
    });

    res.cookie('accessToken', accessToken, {
        maxAge: process.env.JWT_ACCESS_COOKIE_EXPIRES_IN * 60 * 1000,
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'development' ? 'Lax' : 'strict',
        secure: process.env.NODE_ENV === 'production'
    });

    res.status(200).json({
        status: 'success',
        accessToken,
        data: {
            user
        }
    });
});

exports.verifyEmail = asyncHandler(async (req, res, next) => {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
        return next(new AppError('Please both fields are required.', 400))
    }

    const user = await User.findOne({ email });
    if (!user) {
        await mitigateTimingAttack();
        return next(new AppError('User not found. Please consider signing up.', 404));
    }

    if (user.otp !== otp) {
        return next(new AppError('Invalid OTP', 400));
    }

    if (Date.now() > user.otpExpiresAt) {
        return next(new AppError('OTP has expired. Please request for a new one.', 400));
    }

    user.otp = undefined;
    user.otpExpiresAt = undefined;
    user.isEmailVerified = true;

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
        status: 'success',
        message: 'Email successfully verified. Please you can now log in.'
    });
});

exports.resendOTP = asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return next(new AppError('Please enter your email.', 400));
    }

    const user = await User.findOne({ email });
    if (!user) {
        await mitigateTimingAttack();
        return next(new AppError('User not found. Please sign up.', 404));
    }

    if (user.isEmailVerified) {
        return next(new AppError('Email already verified. Please sign in.', 400));
    }

    const { otp, otpExpiresAt } = generateOTP();

    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    user.isEmailVerified = false;

    await user.save({ validateBeforeSave: false });

    try {
        const subject = 'OTP Verification Code (Valid for 15 minutes)';
        const message = `Your new OTP verification code is ${otp}`;

        await sendEmail({
            email,
            subject,
            message
        });

        return res.status(200).json({
            status: 'success',
            message: 'OTP has been sent to verify your email.'
        });

    } catch (err) {
        console.log('Error in re-sending verify email OTP');
        console.log(err);

        user.otp = undefined;
        User.otpExpiresAt = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError('There was an error in sending OTP to your email. Please try again.', 500));
    }
});

exports.forgotPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return next(new AppError('Please email is required.', 400));
    }

    const user = await User.findOne({ email }).select('+passwordResetToken +passwordResetTokenExpiresAt');
    if (!user) {
        await mitigateTimingAttack();
        return next(new AppError('User not found. Please you may sign up.', 404));
    }

    const resetToken = crypto
        .randomBytes(32)
        .toString('hex');

    const encryptedResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    // console.log(encryptedResetToken);

    user.passwordResetToken = encryptedResetToken;
    user.passwordResetTokenExpiresAt = Date.now() + 15 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    try {
        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;
        const subject = `Password Reset Token (Valid for 15 minutes)`;
        const message = `Your password reset token is:\n${resetURL}`;

        await sendEmail({
            email,
            subject,
            message
        });

        return res.status(200).json({
            status: 'success',
            message: 'Password reset token sent successfully to your email.'
        });

    } catch (err) {
        console.log('Error in sending password reset token to user email.');
        console.log(err);

        user.passwordResetToken = undefined;
        user.passwordResetTokenExpiresAt = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError('There was an error in sending reset token to your email. Please try again.', 500));
    }
});

exports.resetPassword = asyncHandler(async (req, res, next) => {
    const { resetToken } = req.params;
    const { email, password, confirmPassword } = req.body;
    
    if (!email || !resetToken || !password || !confirmPassword) {
        return next(new AppError('Please provide both email and password.', 400));
    }

    const encryptedResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    const user = await User.findOne({ email, passwordResetToken: encryptedResetToken }).select('+passwordResetTokenExpiresAt +passwordChangedAt +password +confirmPassword');
    if (!user) {
        await mitigateTimingAttack();
        return next(new AppError('User not found or reset token is invalid.', 400));
    }

    if (user.passwordResetTokenExpiresAt && Date.now() >  user.passwordResetTokenExpiresAt) {
        return next(new AppError('Reset token has expired.', 400));
    }

    user.password = password;
    user.confirmPassword = confirmPassword;
    user.passwordChangedAt = Date.now();
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpiresAt = undefined;

    await user.save();

    // In a very real-world app, send email to user to
    // let them know that password was changed.

    res.status(200).json({
        status: 'success',
        message: 'Password changed successfully. Please log in again.'
    });
});

exports.updatePassword = asyncHandler(async (req, res, next) => {
    const { currentPassword, newPassword, newConfirmPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
        await mitigateTimingAttack();
        return next(new AppError('User not found. Please log again.', 404));
    }

    const isMatch = await user.isPasswordCorrect(currentPassword, user.password);
    if (!isMatch) {
        return next(new AppError('Invalid current password.', 401));
    }

    const isNewPasswordSameAsCurrentPassword = await bcrypt.compare(newPassword, user.password);
    if (isNewPasswordSameAsCurrentPassword) {
        return next(new AppError('New password must be different from current password.', 400));
    }

    user.password = newPassword;
    user.confirmPassword = newConfirmPassword;
    await user.save();
    
    // todo: send email to alert user.
    
    res.status(200).json({
        status: 'success',
        message: 'Password changed successfully.'
    });
});

exports.refreshAccessToken = asyncHandler(async (req, res, next) => {
    const { refreshToken } = req.cookies;
    
    if (!refreshToken) {
        return next(new AppError('Token missing. Please log in again.', 401));
    }
    
    const decoded = await verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id).select('+sessions');
    if (!user) {
        return next(new AppError('User belonging to this token does not exist.', 401));
    }

    const sessionIndex = user.sessions.findIndex((sess) => sess.refreshToken === refreshToken);

    if (sessionIndex === -1) {
        return next(new AppError('Session not found. Please log in again.', 401));
    }

    const newRefreshToken = signRefreshToken(user);
    const newAccessToken = signAccessToken(user);

    user.sessions[sessionIndex].refreshToken = newRefreshToken;
    user.sessions[sessionIndex].createdAt = new Date();
    await user.save({ validateBeforeSave: false });
    
    res.cookie('refreshToken', newRefreshToken, {
        maxAge: process.env.JWT_REFRESH_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'development' ? 'Lax' : 'strict',
        secure: process.env.NODE_ENV === 'production'
    });

    res.cookie('accessToken', newAccessToken, {
        maxAge: process.env.JWT_ACCESS_COOKIE_EXPIRES_IN * 60 * 1000,
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'development' ? 'Lax' : 'strict',
        secure: process.env.NODE_ENV === 'production'
    });

    res.status(200).json({
        status: 'success',
        accessToken: newAccessToken,
    });
});

exports.logout = asyncHandler(async (req, res, next) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
        return next(new AppError('Missing token. Please log in again.', 401));
    }

    const user = await User.findById(req.user.id).select('+sessions');
    if (!user) {
        return next(new AppError('User not found.', 404));
    }

    user.sessions = user.sessions.filter((sess) => sess.refreshToken !== refreshToken);
    await user.save({ validateBeforeSave: false });

    res.clearCookie('refreshToken', {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'development' ? 'Lax' : 'strict',
        secure: process.env.NODE_ENV === 'production'
    });

    res.clearCookie('accessToken', {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'development' ? 'Lax' : 'strict',
        secure: process.env.NODE_ENV === 'production'
    });

    res.status(200).json({
        status: 'success',
        message: 'Logged out successfully.'
    });
});