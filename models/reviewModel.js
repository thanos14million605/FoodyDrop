const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    reviewFor: {
        type: String,
        required: [true, 'Please select review type.'],
        enum: {
            values: ['restaurant', 'delivery-agent'],
        }
    },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant'
    },
    deliveryAgent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryAgent'
    },
    orderInfo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: [true, 'Review can only be made after a confirmed order.']
    },
    rating: {
        type: Number,
        requred: [true, 'Please provide rating.'],
        min: [1.0, 'Rating must be between 1.0 and 5.0'],
        max: [5.0, 'Rating must be between 1.0 and 5.0']
    },
    review: {
        type: String,
        required: [true, 'Please write your review.'],
        maxlength: [200, 'Review should be 200 or less characters.']
    },

}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// I will virtual populate the order info.

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;