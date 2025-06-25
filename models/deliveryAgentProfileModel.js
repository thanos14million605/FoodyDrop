const mongoose = require('mongoose');

const develiveryProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Please provide delivery agent name.'],
    },
    // Delivery agent can deliver for or work for multiple restaurants
    // so I can make this an array sort of. 
    // Delivery agent can query for all the current Orders of a particular restaurant
    // that is in his restaurant id.
    
    // On fronted, a restaurant can see all their delivery agents and 
    // assign orders to them.

    // These can also hold restaurant data that the delivery agent 
    // is registered with.
    restaurants: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Restaurant',
            required: [true, 'Please provide restaurant name.'],
        }
    ],
    currentLocation: {
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number]
    },
    availability: {
        type: String,
        enum: ['online', 'offline']
    },

    // When order is delivered, this currentOrder data
    // should be deleted

    // Nope, the better approach will be to query for all orders
    // where order status is not delivered and order is not cancelled
    // NB: there is status field in orderSchema
    currentOrders: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order'
        }
    ],
    vehicleType: String,
    licenseNumber: String
});

const DeliveryAgent = mongoose.model('DeliveryAgent', develiveryProfileSchema);

module.exports = DeliveryAgentProfile;