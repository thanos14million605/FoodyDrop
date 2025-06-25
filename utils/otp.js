const crypto = require('crypto');

const generateOTP = () => {
    const otp = `${crypto.randomInt(100000, 999999)}`;
    const otpExpiresAt = Date.now() + 15 * 60 * 1000;
    return { otp, otpExpiresAt };
};

const generateAdmin2FAOTP = () => {
    const adminTwoFactorCode = `${crypto.randomInt(100000, 999999)}`;
    const adminTwoFactorCodeExpiresAt = Date.now() + 5 * 60 * 1000;
    return { adminTwoFactorCode, adminTwoFactorCodeExpiresAt };
}

module.exports = { generateOTP, generateAdmin2FAOTP };