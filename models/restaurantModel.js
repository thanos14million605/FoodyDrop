const mongoose = require('mongoose');
const validator = require('validator');

const restaurantSchema = new mongoose.Schema({
    restaurantName: {
        type: String,
        required: [true, 'Restaurant name is required.']
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Restaurant owner name is required.'],
        trim: true,
    },
    email: {
        type: String,
        unique: true,
        required: [true, 'Please provide contact email.'],
        validate: [validator.isEmail, 'Please provide a valid email.'],
        lowercase: true,
    },
    phoneNumber: {
        type: String,
        required: [true, 'Please provide phone number.']
    },
    address: {
        type: String,
        required: [true, 'Please provide restaurant address.']
    },
    isActive: {
        type: Boolean,
        select: false,
    },
    location: {
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number]
    },
    openingTime: {
        type: String,
    },
    closingTime: {
        type: String
    },
    isOpen: {
        type: String,
        default: 'Open',
        enum: ['Open', 'Closed', 'Temporarily Closed', 'Non-operational']
    },
    averageRating: {
        type: Number,
    },
    ratingsQuantity: Number,
    images: [String],
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true }}
);

restaurantSchema.index({
    location: '2dsphere'
});

restaurantSchema.index({
    owner: 1
});

// Virutual Populate with Menus
restaurantSchema.virtual('restaurant', {
    ref: 'Menu',
    foreignField: 'restaurant',
    localField: '_id'
});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

module.exports = Restaurant;