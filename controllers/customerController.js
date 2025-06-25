const Customer = require('./../models/customerModel');
const asyncHandler = require('./../utils/asyncHandler');
const AppError = require('./../utils/AppError');

// For creating address
exports.createDefaultAddress = asyncHandler(async (req, res, next) => {
    const { defaultAddress } = req.body;
    
    if (!defaultAddress) {
        return next(new AppError('Please provide a default address.', 400));
    }

    const customer = await Customer.findOne({ user: req.user.id });

    if (customer) {
        return next(new AppError('Customer default address already exists. You may update it.', 400));
    }

    const newCustomerAddress = await Customer.create({
        user: req.user.id,
        defaultAddress
    });

    res.status(201).json({
        status: 'success',
        data: {
            customer: newCustomerAddress
        }
    });
});

// For getting all address
exports.getAllCustomerAddresses = asyncHandler(async (req, res, next) => {
    const customer = await Customer.findOne({ user: req.user.id });

    if (!customer) {
        return next(new AppError('No addresses found.', 400));
    }

    // console.log(customer);
    res.status(200).json({
        status: 'success',
        data: {
            defaultAddress: customer.defaultAddress,
            otherAddresses: customer.otherAddresses?.length === 0 ? 'none' : customer.otherAddresses
        }
    });
});

// Updating an address
exports.updateDefaultAddress = asyncHandler(async (req, res, next) => {
    const { defaultAddress } = req.body;
    const updatedCustomer = await Customer.findOneAndUpdate({ user: req.user.id }, { defaultAddress }, {
        new: true,
        runValidators: true
    });

    if (!updatedCustomer) {
        return next(new AppError('Address not found.', 404))
    }

    res.status(200).json({
        status: 'success',
        data: {
            customer: updatedCustomer
        }
    }); 
});

// Add another address
exports.addOtherAddress = asyncHandler(async (req, res, next) => {
    const { address } = req.body;

    console.log(req.user.id);
    const customer = await Customer.findOne({ user: req.user.id });
    if (!customer) {
        return next(new AppError('Customer not found', 404));
    }

    if (customer.otherAddresses.length >= 5) {
        return next(new AppError('Maximum of 5 addresses is allowed.', 400));
    }
    customer.otherAddresses.push(address);
    await customer.save({ validateBeforeSave: false });

    res.status(200).json({
        status: 'success',
        data: {
            customer
        }
    });
});

// Update other address
exports.updateOtherAddress = asyncHandler(async (req, res, next) => {
    const { address } = req.body;
    const { index } = req.params;
    
    const customer = await Customer.findOne({ user: req.user.id });
    if (!customer || !customer.otherAddresses[Number.parseInt(index)]) {
        return next(new AppError('Address not found', 404));
    }

    customer.otherAddresses[Number.parseInt(index)] = address;
    await customer.save({ validateBeforeSave: false });

    res.status(200).json({
        status: 'success',
        data: { 
            customer 
        }
    });
});

// Delete other address
exports.deleteOtherAddress = asyncHandler(async (req, res, next) => {
    const { index } = req.params;

    const customer = await Customer.findOne({ user: req.user.id });

    if (!customer || !customer.otherAddresses[Number.parseInt(index)]) {
      return next(new AppError('Address not found.', 404));
    }
  
    customer.otherAddresses.splice(Number.parseInt(index), 1); // filter also would have worked by filter((_, i) => i !== index)
    await customer.save({ validateBeforeSave: false });

    res.status(204).json({
        status: 'success',
        data: {
            customer
        }
    });
});