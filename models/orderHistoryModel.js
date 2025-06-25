const mongoose = require('mongoose');

const orderHistorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Customer data is required.'],
    },
    orderCancelledCount: {
        type: Number,
    },

}, { timestamps: true });

const OrderHistory = mongoose.model('OrderHistory', orderHistorySchema);

module.exports = OrderHistory;