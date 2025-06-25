const express = require('express');
const restaurantController = require('./../controllers/restaurantController');
const { protectRoute } = require('../middlewares/protectRoute');
const { restrictTo } = require('../middlewares/restrictTo');
// const menuRouter = require('./menuRoutes');

const router = express.Router({
    mergeParams: true
});

// Not a good idea because what if a malicious restaurant
// owner passed in the id of another restaurant. So, I will get 
// restaurant id detail by using req.user.id 

// // Nested route implementation for creating menu
// router.use('/:restaurantId/menus', menuRouter);

router.use(protectRoute);

router
    .route('/')
    .post(
        restrictTo('admin'),
        restaurantController.createRestaurant,
    )
    .get(
        restrictTo('admin', 'customer'),
        restaurantController.getAllRestaurants,
    );

    
router
    .route('/:id')
    .get(
        restaurantController.getRestaurant
    )
    .patch(
        restrictTo('admin', 'restaurant-owner'),
        restaurantController.updateRestaurant
    )
    .delete(
        restrictTo('admin'),
        restaurantController.deleteRestaurant
    );

module.exports = router;