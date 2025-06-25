const rateLimit = require('express-rate-limit');

const generalRateLimiter = rateLimit({
    max: 500,
    windowMs: process.env.GLOBAL_RATE_LIMIT_DURATION * 60 * 60 * 1000, // 2 hours
    message: {
        status: 'fail',
        message: 'Too many requests. Try again in 2 hours.'
    },
    standardHeaders: true,
    legacyHeaders: false
});
// 10 Requests per hour during production. 
// 100 Requests per hour during production
const loginLimiter = rateLimit({
    max: process.env.NODE_ENV === 'production' ? 10 : 100,
    windowMs: process.env.LOGIN_RATE_LIMIT_DURATION * 60 * 60 * 1000,
    message: {
        status: 'fail',
        message: 'Too many requests. Please try again in 1 hour.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// 3 request per 30 minutes during production 
// 100 per 30 minutes during during development
const passwordRateLimiter = rateLimit({
    max: process.env.NODE_ENV === 'production' ? 3 : 100,
    windowMs: process.env.PASSWORD_RESET_RATE_LIMIT_DURATION * 60 * 1000,
    message: {
        status: 'fail',
        message: 'Too many requests. Please try again in 30 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false
});


// 2 requests per 15 minutes during production
// 10 requests per 15 minutes during development
const refreshAccessTokenLimiter = rateLimit({
    max: process.env.NODE_ENV === 'development' ? 10 : 2,
    windowMs: process.env.REFRESH_RATE_LIMIT_DURATION * 60 * 1000,
    message: {
        status: 'fail',
        message: 'Too many requests. Try again in 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// standard rate limiters like express-rate-limit are not 
// ideal when you want user-role-based blocking (like blocking 
// non-admins after 3 failed attempts to access admin routes for 3 days).

// const adminRoutesRateLimiter = rateLimit({
//     max: process.env.NODE_ENV === 'production' ? 2 : 5,
//     windowMs: 2 * 60 * 60 * 1000,
//     message: {
//         status: 'fail',
//         message: 'Too many request. Please try again in 15 minutes.'
//     },
//     standardHeaders: true,
//     legacyHeaders: false
// });

// 3 requests per 15 minutes during production
// 100 requests per 15 minutes during development

const verifyAdmin2FACodeLimiter = rateLimit({
    max: 3,
    windowMs: process.env.VERIFY_ADMIN_2FA_CODE_RATE_LIMIT_DURATION * 60 * 60 * 1000,
    message: {
        status: 'fail',
        message: 'Too many request. Please try again in 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = { 
    loginLimiter, 
    verifyAdmin2FACodeLimiter, 
    passwordRateLimiter,
    refreshAccessTokenLimiter,
    generalRateLimiter,
    // adminRoutesRateLimiter
};