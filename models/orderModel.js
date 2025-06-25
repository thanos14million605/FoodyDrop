const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Customer details is required.']
    },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: [true, 'Restaurant details is required.']
    },
    menuItems: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Menu',
            required: true,
        }
    ],

    // Restaurant owner should assign delivery agent to 
    // to every order after some time when it is made.
    deliveryAgent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryAgent',
    },
    // With highly sophisticated systems, I can keep track of 
    // how many times a customer order and cancelled. If two 
    // consecutive times, then system must make sure they pay
    // online in order to make a successful order.
    // Then I can reset the number of times that particular 
    // customer cancelled orders
    status: {
        type: String,
        default: 'confirmed',
        enum: [
            'pending', 'confirmed', 'preparing',  
            'ready', 'picked-up', 'on-the-way',  
            'delivered', 'cancelled' 
        ]    
    },
    paymentStatus: {
        type: String,
        default: 'unpaid',
        enum: [
            'unpaid', 'paid', 
            // 'refunded',   // There will be nothing like refunded in Gambia lol   
            'failed', 'pending'       
        ]
    },
    placedAt: {
        type: Date,
        default: new Date()
    },
    // To be filled by delivery once he clicked 
    // delivered on frontend, then this field 
    // must be field with that date.
    deliveredAt: {
        type: Date,
    },
    deliveryLocation: {
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number]
    },
    totalAmount: {
        type: Number,
    },
    tipAmount: {
        type: Number,
        default: 0,
        select: false
    },
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// I can use query middlewares, indexing, virtual populate
// and so many stuffs here. Nested routes and a lot more 
// stuffs.
// I can also use slugs if I want.


// Tip Calculation: 
// If total quantity is above 3 and total price is more than 
// or equal to 300, tip amount = 3%

// If total quantity is above 5 and total price is more or 
// equal to 500, tip amount = 5%

// If total quantity is above 10 and totla price is more or equal
// to 1000, tip = 10%

// With a production app, I can even give status to customers such as 
// special customer based on the amount they purchase.

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;