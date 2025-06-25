const jwt = require('jsonwebtoken');
const { promisify } = require('util');

exports.signAccessToken = (user) => {
    return jwt.sign({ id: user._id }, process.env.JWT_ACCESS_SECRET, {
        expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN,
    });
};

exports.signRefreshToken = (user) => {
    return jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN,
    });
};

exports.verifyToken = async (token, envVar) => {
    return await promisify(jwt.verify)(token, envVar);
};