const Restaurant = require('./../models/restaurantModel');
const User = require('./../models/userModel');
const asyncHandler = require('./../utils/asyncHandler');
const AppError = require('./../utils/AppError');
const { 
    applyFieldLimiting,
    applyFiltering,
    applySorting,
    applyPagination
} = require('./../utils/apiFeatures');

// Restricted to only admin and owners of system.
// Restaurant owner should only have access to updating
// the openingTime, closingTime, isOpen, and images fields

// All other CRUD operations will be restricted to admin
exports.createRestaurant = asyncHandler(async (req, res, next) => {
    
    // owner id will come from Nested routes
    // users/ownerId/restaurants

    // I should always use nested routes where there is 
    // a clear parent-child relationship and it is a very good
    // practice as my teacher said.

    // Parent resource: users
    // router.use('/:ownerId/restaurants, restaurantRouter);

    // Child resource: restaurants
    // const router = express.Router({
    //      mergeParams: true
    // });
    const { 
        restaurantName,
        email,
        phoneNumber,
        address,
        location,
    } = req.body;

    const restaurantOwner = await User.findById(req.params.ownerId).select('+role');

    if (!restaurantOwner || restaurantOwner.role !== 'restaurant-owner') {
        return next(new AppError('Restaurant owner not found. Hence, restaurant can\'t be registered', 400));
    }

    const newRestaurant = await Restaurant.create({
        restaurantName,
        owner: req.params.ownerId,
        email,
        phoneNumber,
        address,
        location,
    });

    res.status(201).json({
        status: 'success',
        data: {
            restaurant: newRestaurant
        }
    }); 
});

exports.getAllRestaurants = asyncHandler(async (req, res, next) => {
    let query = Restaurant.find()
        .populate({
            path: 'owner',
            select: '_id name email'
        });

    query = applyFiltering(query, req.query);
    query = applyFieldLimiting(query, req.query);
    query = applySorting(query, req.query);
    query = applyPagination(query, req.query);

    const restaurants = await query;

    if (restaurants.length === 0) {
        return next(new AppError('No matching records', 200));
    }

    if (req.user.role === 'admin') {
        return res.status(200).json({
            status: 'success',
            results: restaurants.length,
            data: {
                restaurants
            }
        });
    }

    res.status(200).json({
        status: 'success',
        results: restaurants.length,
        data: {
            restaurants: restaurants.map((restaurant) => {
                return { 
                    name: restaurant.restaurantName,
                    email: restaurant.email,
                    address: restaurant.address,
                    location: restaurant.location,
                    openingTime: restaurant.openingTime || 'Not open today',
                    closingTime: restaurant.closingTime || 'Not open today',
                    isOpen: restaurant.isOpen,
                    averageRating: restaurant.averageRating,
                    ratingsQuantity: restaurant.ratingsQuantity
                }
            })
        }

    });
});

exports.getRestaurant = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+role');
    
    if (user.role === 'restaurant-owner') {
        const restaurant = await Restaurant.findOne({ _id: req.params.id, owner: req.user.id })
            .populate({
                path: 'owner',
                select: '_id name email'
            });
        
        if (!restaurant) {
            return next(new AppError('Restaurant not found', 404));
        }

        return res.status(200).json({
            status: 'sucess',
            data: {
                restaurant
            }
        });
    }

    const restaurant = await Restaurant.findById(req.params.id)
        .populate({
            path: 'owner',
            select: '_id name email'
        });

    if (!restaurant) {
        return next(new AppError('Restaurant not found', 404));
    }

    if (req.user.role === 'admin') {
        return res.status(200).json({
            status: 'success',
            data: {
                restaurant
            }
        });
    }

    res.status(200).json({
        status: 'success',
        data: {
            name: restaurant.restaurantName,
            email: restaurant.email,
            address: restaurant.address,
            location: restaurant.location,
            openingTime: restaurant.openingTime || 'Not open today',
            closingTime: restaurant.closingTime || 'Not open today',
            isOpen: restaurant.isOpen,
            averageRating: restaurant.averageRating,
            ratingsQuantity: restaurant.ratingsQuantity
                
        }

    });

});

exports.updateRestaurant = asyncHandler(async (req, res, next) => {
    const restaurant = await Restaurant.findOne({ _id: req.params.id, owner: req.user.id })
        // .populate({
        //     select: 'owner',
        //     path: '_id name email'
        // });

    if (!restaurant) {
        return next(new AppError('Restaurant not found', 404));
    }
    
    const allowedFields = [
        'restaurantName', 'owner', 
        'phoneNumber', 'openingTime',
        'closingTime', 'isOpen',
        'images'
    ];

    const updates = {};
    allowedFields.forEach((allowedField) => {
        if (req.body[allowedField]) {
            updates[allowedField] = req.body[allowedField];
        }
    });

    const updatedRestaurant = await Restaurant.findOneAndUpdate({ _id: req.params.id, owner: req.user.id }, updates, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: 'success',
        data: {
            restauarant: updatedRestaurant
        }
    });
});

// In a real-world scenerio, I will ensure that admin only soft deletes a restaurant
// for example if restaurant fails to make obligations, just soft-delete.
// In that case, I am gonna add a field such as isActive in restaurantSchema
// and in getAllRestaurants and getRestaurant, I will ensure that only active
// restaurants are shown.

exports.deleteRestaurant = asyncHandler(async (req, res, next) => {
    const restaurant = await Restaurant.findOne({ _id: req.params.id }).select('+isActive')
        .populate({
            path: 'owner',
            select: '_id name email'
        });

    if (!restaurant) {
        return next(new AppError('Restaurant not found.', 404));
    }

    restaurant.isActive = false;

    res.status(204).json({
        status: 'success',
        data: null
    });

});