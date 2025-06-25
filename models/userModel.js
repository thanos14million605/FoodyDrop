const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');

const refreshSessionSchema = new mongoose.Schema({
    refreshToken: {
        type: String,
    },
    ip: String,
    userAgent: String,
    fingerprint: String,
}, { timestamps: true }
);

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please tell us your name.'],
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: [true, 'Please tell us your email.'],
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email.']
    },
    password: {
        type: String,
        required: [true, 'Please provide a password.'],
        min: [8, 'Password length must be at least 8.'],
        select: false,
    },
    confirmPassword: {
        type: String,
        required: [true, 'Password confirm is required.'],
        validate: {
            validator: function(val) {
                return val === this.password;
            },
            message: 'Password and password confirm do not match.'
        }
    },
    role: {
        type: String,
        default: 'customer',
        enum: {
            values: ['customer', 'admin', 'delivery-agent', 'restaurant-owner'],
        },
        select: false
    },
    photoUrl: {
        type: String,
        required: false,
    },
    photoPublicId: {
        type: String,
        required: false,
    },
    sessions: {
        type: [refreshSessionSchema],
        select: false,
    },
    otp: String,
    otpExpiresAt: {
        type: Date,
    },
    isEmailVerified: {
        type: Boolean,
        default: false,   
    },
    adminTwoFactorEmail: {
        type: String,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email.'],
        select: false
    },
    adminTwoFactorCode: {
        type: String,
        select: false
    },
    adminTwoFactorCodeExpiresAt: {
        type: Date,
        select: false,
    },
    lastLoginIP: {
        type: String,
        select: false
    },
    lastLoginTimestamp: {
        type: Date,
        select: false
    },
    isActive: {
        type: Boolean,
        default: true,
        select: false,
    },
    passwordChangedAt: {
        type: Date,
        select: false
    },
    passwordResetToken: {
        type: String,
        select: false
    },
    passwordResetTokenExpiresAt: {
        type: Date,
        select: false
    },

}, { timestamps: true, 
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 12);
    this.confirmPassword = undefined;

    next();
});

userSchema.methods.isPasswordCorrect = async function(candidate, actual) {
    return await bcrypt.compare(candidate, actual);
};

userSchema.index({
    role: 1,
    isActive: 1
});

const User = mongoose.model('User', userSchema);

module.exports = User;