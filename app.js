// 3rd-Party Modules OR Packages and Headers
const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const slowDown = require('express-slow-down');

// Defined Modules
const AppError = require('./utils/AppError');
const { globalErrorHandler } = require('./middlewares/globalErrorHandler');
const { generalRateLimiter } = require('./middlewares/rateLimiters');

// Routers
const authRouter = require('./routes/authRoutes');
const sessionRouter = require('./routes/sessionRoutes');
const userRouter = require('./routes/userRoutes');
const restaurantRouter = require('./routes/restaurantRoutes');
const customerRouter = require('./routes/customerRoutes');
const menuRouter = require('./routes/menuRoutes');

const app = express();

// Security Headers
app.use(cookieParser());

const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 100, // allow 100 requests per 15 min
    delayMs: () => 1000 // after 100, delay each request by 1s
});

// Limiters
app.use('/api', speedLimiter);
app.use('/api', generalRateLimiter);

app.use(morgan('dev'));
app.use(express.json({ 
    limit: '10mb'
}));

// Routes and Mounting
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/session', sessionRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/restaurants', restaurantRouter);
app.use('/api/v1/customers', customerRouter);
app.use('/api/v1/menus', menuRouter);

// Unhandled Routes
app.use((req, _, next) => {
    return next(new AppError(`Cannot find ${req.originalUrl} on this server.`, 404));
});

// Global Error Handler Middleware.
app.use(globalErrorHandler);

module.exports = app;