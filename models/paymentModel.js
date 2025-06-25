const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Payment must be made by a customer.'],
    },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: [true, 'Payment must be made to a restaurant.']
    },
    // If paid in cash or payment is made directly to delivery agent
    // or to adminstrator or to delivery agent.
    // This means there should be a route for delivery agent
    // to be able to modify payment status if he receives payment
    // by cash. Also I have to be careful that the order must exist
    // before delivery agent will even have opportunity to mark any 
    // payment as paid
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: [true, 'Order detail is required.']
    },
    deliveryAgent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    amount: {
        type: Number,
        required: [true, 'Payment amount is required.']
    },
    paid: {
        type: Boolean,
        default: true
    }
}); 

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;