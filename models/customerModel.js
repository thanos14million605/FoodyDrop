const mongoose = require('mongoose');

// Can be used for creating address of a customer
// Getting All Addresses added by a customer
// Editing Address and 
// Deleting address
const customerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  defaultAddress: {
      type: String,
      required: [true, 'Address is required']
  },
  otherAddresses: [
    {
      type: String,
    }
  ],
}, { timestamps: true });

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;