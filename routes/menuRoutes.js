const express = require('express');
const menuController = require('./../controllers/menuItemController');
const { protectRoute } = require('../middlewares/protectRoute');
const { restrictTo } = require('../middlewares/restrictTo');
const upload = require('./../utils/multer');

const router = express.Router();

router.use(protectRoute);

// Creating Menu: RBAC, for restaurant-owner only.
router
    .route('/')
    .post(
        restrictTo('restaurant-owner'),
        menuController.createMenu
    )

// Retrieving Menus Owned By The Restaurant
router
    .route('/my-restaurant-menus')
    .get(
        restrictTo('restaurant-owner'),
        menuController.getAllMenusOfRestaurant
    )

// Retrieving, Updating and Deleting Menu Owned By The Restaurant
router
    .route('/my-restaurant-menus/:id')
    .get(
        restrictTo('restaurant-owner'),
        menuController.getMenuOfRestaurant
    )
    .patch(
        restrictTo('restaurant-owner'),
        menuController.updateMenu
    )
    .delete(
        restrictTo('restaurant-owner'),
        menuController.deleteMenu
    )
    

// Images uploadings and deletion

// New image upload .push
router
    .route('/:id/images')
    .patch(
        restrictTo('restaurant-owner'),
        menuController.uploadMenuImage
    );

// Image uploads via streaming and multer
router
    .route('/:id/images/upload-menus')
    .patch(
        restrictTo('restaurant-owner'),
        upload.array('photos', 3),
        menuController.uploadMultipleMenuImagesMulterAndStreaming
    );


// Image updations
router
    .route('/:id/images/:imageIndex')
    .patch(
        restrictTo('restaurant-owner'),
        menuController.uploadMenuImage
    );

router
    .route('/:id/images/:imageIndex')
    .delete( 
        restrictTo('restaurant-owner'),
        menuController.deleteMenuImage
    );


// Retrieving menu for customers
router
    .route('/foodydrop-menus')
    .get(
        restrictTo('customer'),
        menuController.getAllMenus
    );

router
    .route('/foodydrop-menus/:id')
    .get(
        restrictTo('customer'),
        menuController.getMenu
    );

module.exports = router;