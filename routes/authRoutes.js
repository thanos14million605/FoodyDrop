const express = require('express');
const authController = require('./../controllers/authController');
const { protectRoute } = require('./../middlewares/protectRoute');
const { 
    loginLimiter,
    refreshAccessTokenLimiter, 
    passwordRateLimiter, 
    verifyAdmin2FACodeLimiter 
} = require('../middlewares/rateLimiters');

const router = express.Router();

router.post(
    '/login', 
    loginLimiter,
    authController.login
);

router.post(
    '/signup', 
    authController.signup
);

router.post(
    '/forgot-password', 
    passwordRateLimiter, 
    authController.forgotPassword
);

router.post(
    '/resend-otp', 
    passwordRateLimiter, 
    authController.resendOTP
);

router.post(
    '/verify-email', 
    authController.verifyEmail
);

// Later on for real-world production apps where my client
// needs very secure authentication, I will protect even this route
// by sending access token to admin when the login route handler is hit
// also send the two factor code to email. Then check admin details by 
// req.user.id and also compare the code sent to email to the code 
// sent in body.
router.post(
    '/verify-admin-2fa-code', 
    verifyAdmin2FACodeLimiter, 
    authController.verifyAdmin2FACode
);

router.patch(
    '/update-password', 
    passwordRateLimiter, 
    authController.updatePassword
);

router.patch(
    '/reset-password/:resetToken', 
    passwordRateLimiter, 
    authController.resetPassword
);

router.use(protectRoute);

router.patch(
    '/update-password', 
    passwordRateLimiter, 
    authController.updatePassword
);

router.post(
    '/refresh-access-token', 
    refreshAccessTokenLimiter, 
    authController.refreshAccessToken
);

router.post(
    '/logout', 
    authController.logout
);

module.exports = router;