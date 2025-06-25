const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: [true, 'Please provide restaurant details.']
    },
    name: {
        type: String,
        required: [true, 'Please provide menu name.']
    },
    description: {
        type: String,
        maxlength: [200, 'Description must be 200 characters or less.'],
        required: [true, 'Menu description is required.']
    },
    price: {
        type: Number,
        required: [true, 'Please provide menu price'],

    },
    category: {
        type: String,
        required: [true, 'Please provide category.'],
        default: 'other',
        enum: {
            values: ['starter', 'main-course', 'dessert',
                'beverage', 'snack', 'salad', 'soup',
                'side', 'combo', 'special', 'other'
            ],
            message: 'Please select menu category.'              
        }
    },
    images: [
        {
            imageUrl: {
                type: String,
            },
            imagePublicId: {
                type: String
            }
        }
    ],
    availability: {
        type: String,
        default: 'available',
        enum: ['available', 'not available']
    }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual Populate to be implemented between
// parent and child: i.e restaurants and menus

// Index restaurant
menuItemSchema.index({
    restaurant: 1
});

const menu = mongoose.model('menu', menuItemSchema);

module.exports = menu;