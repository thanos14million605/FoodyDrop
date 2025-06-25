const AppError = require("../utils/AppError");
const { sendEmail } = require("../utils/email");

exports.globalErrorHandler = async (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    let customError = err;

    if (err.name === 'CastError') {
        customError = new AppError(`Invalid ${err.path}: ${err.value}`, 400);
    }

    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(el => el.message);
        customError = new AppError(`${messages.join('. ')}`, 400);
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const value = err.keyValue[field];
        customError = new AppError(`Duplicate ${value}. Please enter another ${field}`, 400);
    }

    if (err.name === 'JsonWebTokenError') {
        customError = new AppError(`Invalid token. Please log in again.`, 401);
    }

    if (err.name === 'TokenExpiredError') {
        customError = new AppError('Token has expired. Please log in again.', 401);
    }

    if (process.env.NODE_ENV === 'development') {
        console.log(err);
        res.status(err.statusCode).json({
            status: err.status,
            message: err,
            stack: err.stack
        });
    }

    if (process.env.NODE_ENV === 'production') {
        if (!customError.isOperational) {
            console.log('Send Email to Developer');
            
            const errorDetails = {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                requestedURL: req.originalUrl,
                err: err,
            };

            try {
                const subject = 'None Operational Error';
                const message = `A none operational error has just occured.\n
                ip: ${req.ip}
                userAgent: ${req.get('User-Agent')},
                requestedURL: ${req.originalUrl},
                err: ${err},
                `;

                await sendEmail({
                    email: 'e.gajaga2022@gmail.com',
                    subject,
                    message
                });

            } catch (error) {
                console.log('A non-operational error has occurred but could not be sent to email.');
                console.log(errorDetails);
            }
        }

        res.status(customError.statusCode || 500).json({
            status: customError.status || 'error',
            message: customError.isOperational ? 
                customError.message : 'Something went wrong on the server!'
        });
    }
};