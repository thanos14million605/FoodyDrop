const express = require('express');
const userController = require('./../controllers/userController');
const { protectRoute } = require('./../middlewares/protectRoute');
const { restrictTo } = require('./../middlewares/restrictTo');
const restaurantRouter = require('./restaurantRoutes');
const upload = require('./../utils/multer');

// const customerRouter = require('./customerRoutes');

const router = express.Router();

router.use('/:ownerId/restaurants', restaurantRouter);

// I can easily get customerId from req.user.id so no need for nested routes.
// router.use('/:customerId/customers', customerRouter);

router.use(protectRoute);

router.patch(
    '/profile-image', 
    userController.updateProfileImage
);

router.patch(
    '/upload-profile-image',
    upload.single('photo'),
    userController.updateProfileImageWithMulterAndStreams
);

router.delete(
    '/profile-image', 
    userController.deleteProfileImage
);


router.patch(
    '/update-me', 
    restrictTo('customer'), 
    userController.updateMe
);

router.delete(
    '/delete-me', 
    restrictTo('customer'), 
    userController.deleteMe
);

router.get(
    '/me', 
    restrictTo('customer', 'admin'), 
    userController.getMe
);




router
    .route('/')
    .get(
        restrictTo('admin'),
        userController.getAllUsers
    )
    .post(
        restrictTo('admin'),
        userController.createUser
    );

router
    .route('/:id')
    .get(
        restrictTo('admin'),
        userController.getUser
    )
    .patch(
        restrictTo('admin'),
        userController.updateUser
    )
    .delete(
        restrictTo('admin'),
        userController.deleteUser
    );

module.exports = router;