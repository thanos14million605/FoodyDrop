const Restaurant = require("../models/restaurantModel");
const asyncHandler = require("../utils/asyncHandler");
const Order = require('./../models/orderModel');
const User = require('./../models/userModel');
const Menu = require('./../controllers/menuItemController');
const Customer = require('./../models/customerModel');
const OrderHistory = require('./../models/orderHistoryModel');
const Payment = require('./../models/paymentModel');
const AppError = require("../utils/AppError");


// create order for customers
// like delivery location and a lot more stuff.
exports.createOrder = asyncHandler(async (req, res, next) => {

    // /api/v1/restaurants/:restaurantId/orders
    // restaurant Router : router.use('/:restaurantId/orders', orderRouter)
    // orderRouter: const router = express.Router({ mergeParams: true })

    
    // To create an order, menu id(s) must be needed, restaurant data
    // menu id(s) and delivery location will come from the request body
    // also the address they have selected for delivery
    // from the customer Schema be it default or other addresses. I must ensure all are specified
    // otherwise, throw an error..
    // deliveryLocatioon 
    const { menuItems, deliveryLocation, paymentOption, deliveryAddress } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
        return next(new AppError('Customer data not found.', 404));
    }

    const customerOrderHistory = await OrderHistory.findOne({ user: req.user.id });
    if (
        customerOrderHistory.orderCancelledCount && 
        customerOrderHistory.orderCancelledCount === 2 &&
        (paymentOption === 'cash on delivery' || paymentOption === 'pay on delivery')
    ) {
        return next(new AppError('Sorry, you only have pay before delivery option.', 400));
    }

    const restaurant = await Restaurant.findById(req.params.restaurantId);
    if (!restaurant) {
        return next(new AppError('Restaurant does not exit.', 404));
    }

    const menus = await Menu.find({ _id: { $in: menuItems } });
    if (menus.length !== menuItems.length) {
        return next(new AppError('At least one menu does not exist.'));
    }

    // Check whether delivery address is valid and is in customer schema.
    let customer;
    let finalAddress;

    customer = await Customer.findOne({ 
        _id: req.user.id, 
        defaultAddress: deliveryAddress,       
    });

    if (customer) {
        finalAddress = customer.defaultAddress;
    } else {

        customer = await Customer.findOne({ _id: req.user.id, otherAddresses: { $in: [deliveryAddress] } })
        
        if (!customer) {
            return next(new AppError('Delivery address not found in your saved addresses.', 400));
        }

        finalAddress = deliveryAddress;
    }
    
    
    // Calculate tip amount here if applicable.
    
    // Tip Calculation: 
    // If total quantity is above 3 and total price is more than 
    // or equal to 300, tip amount = 3%
    // If total quantity is above 5 and total price is more or 
    // equal to 500, tip amount = 5%
    
    // If total quantity is above 10 and totla price is more or equal
    // to 1000, tip = 10%
    
    const totalAmount = menus.reduce((acc, menu) => acc + Number(menu.price), 0);
    let tipAmount = 0;
    
    if (menuItems.length >= 3 && menuItems.length < 5 && totalAmount >= 300) {
        tipAmount = .03 * totalAmount;
    } else if (menuItems.length >= 5 && menuItems.length < 10 && totalAmount >= 500) {
        tipAmount = .05 * totalAmount;
    } else if (menuItems.length >= 10 && totalAmount >= 1000) {
        tipAmount = 0.1 * totalAmount;
    }

    // With a production app, I can even give status to customers such as 
    // special customer based on the amount they purchase.

    const newOrder = await Order.create({ 
        customer: req.user.id,
        restaurant: restaurant._id,
        deliveryAddress: finalAddress,
        menuItems,
        deliveryLocation,
        totalAmount: totalAmount - tipAmount,
        tipAmount: tipAmount === 0 ? undefined : tipAmount

    });

    // Check whether payment has been done.
    const payment = await Payment.findOne({ order: newOrder._id, customer: req.user.id, restaurant: restaurant._id });
    if (payment) {
        newOrder.paymentStatus = 'paid';
    } else {
        newOrder.paymentStatus = 'pending';
    }

    await newOrder.save({ validateBeforeSave: false });

    res.status(201).json({
        status: 'success',
        data: {
            order: newOrder
        }
    });
});

// for customer
exports.getAllMyOrders = asyncHandler(async (req, res, next) => {

});

exports.getMyOrder = asyncHandler(async (req, res, next) => {

});

// customer update order such as cancelling order
exports.updateMyOrder = asyncHandler(async (req, res, next) => {

});

// For restaurant owners
exports.getAllOrdersOfRestaurant = asyncHandler(async (req, res, next) => {
    // Restaurant owner can only get orders for their own restaurant
    const restaurant = await Restaurant.findOne({  })
});


// get order
exports.getOrderOfRestaurant = asyncHandler(async (req, res, next) => {

});

// restaurant owner can update order data

// like delivery man and other stuffs such as ready on the way and other (status).

// also if user has already paid online and since it takes time 
// and it doesn't update from create order, then in update
// order we should check if user has really paid from paymentModel
// and if so, we update unpaid to paid on frontend.

// Both delivery man and restaurant owner can have access to this route.
exports.updateOrderOfRestaurant = asyncHandler(async (req, res, next) => {

});

// getLatestOrders
// Both delivery man and restaurant owner can have access to this 
// route.
exports.getLatestOrdersOfRestaurant = asyncHandler(async (req, res, next) => {

});

// once this route is hit, I should update the orderCancelledCount for 
// the current customer. 
exports.cancelOrder = asyncHandler(async (req, res, next) => {

});
// On fronted, a restaurant can see all their delivery agents and 
// assign orders to them.
