const Restaurant = require("../models/restaurantModel");
const asyncHandler = require("../utils/asyncHandler");
const Order = require('./../models/orderModel');
const User = require('./../models/userModel');

// Tip Calculation: 
// If total quantity is above 3 and total price is more than 
// or equal to 300, tip amount = 3%

// If total quantity is above 5 and total price is more or 
// equal to 500, tip amount = 5%

// If total quantity is above 10 and totla price is more or equal
// to 1000, tip = 10%

// With a production app, I can even give status to customers such as 
// special customer based on the amount they purchase.

// create order for customers
// like delivery location and a lot more stuff.
exports.createOrder = asyncHandler(async (req, res, next) => {
    
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

// restaurant owner can 

// update order
// like delivery man and other stuffs such as ready on the way and other (status).
// Both delivery man and restaurant owner can have access to this route.
exports.updateOrderOfRestaurant = asyncHandler(async (req, res, next) => {

});

// getLatestOrders
// Both delivery man and restaurant owner can have access to this 
// route.
exports.getLatestOrdersOfRestaurant = asyncHandler(async (req, res, next) => {

});

// On fronted, a restaurant can see all their delivery agents and 
// assign orders to them.
