const streamifier = require('streamifier');
const Menu = require('./../models/menuItemModel');
const Restaurant = require('./../models/restaurantModel');
const asyncHandler = require('./../utils/asyncHandler');
const AppError = require('./../utils/AppError');
const { 
    applyFieldLimiting,
    applyFiltering,
    applySorting,
    applyPagination
} = require('./../utils/apiFeatures');
const cloudinary = require('./../utils/cloudinary');
// In real-life project, there should be a limti on the number of menus of each 
// category that a restaurant can upload based on the charges. 
// So I am gonna check all of that inside createMenu route so that
// no restaurant can create an amount of menus that they haven't paid for.

// To be restricted to only restaurant owner
exports.createMenu = asyncHandler(async (req, res, next) => {

    // Just imlementing only one image upload, later in a real-world app for
    // production, I will implement multiple image uploads.
   const { name, description, price, category, availability, imageBase64 } = req.body;
   
   const restaurant = await Restaurant.findOne({ owner: req.user.id });
    if (!restaurant) {
        return next(new AppError('Something went wrong. Please try again.', 500));
    }
   // Nested route implementation
   // mergeParams in child: menu
   // menuRouter to be mounted in restaurantRouter

    const newMenu = await Menu.create({
        restaurant: restaurant._id,
        name,
        description,
        price,
        category,
        availability
    });

    if (!imageBase64) {

       return res.status(201).json({
            status: 'success',
            data: {
                menu: newMenu
            }
       });
    }

    const result = await cloudinary.uploader.upload(imageBase64, {
        public_id: `${newMenu._id}-${Date.now()}`, // unique per image
        folder: 'menu-images',
        overwrite: true,
        transformation: [
            { quality: 'auto' },
            { fetch_format: 'auto'}
        ]
    });

    newMenu.images.push({ 
        imageUrl: result.secure_url, 
        imagePublicId: result.public_id
    });

    await newMenu.save({ validateBeforeSave: false });

    res.status(201).json({
        status: 'success',
        data: {
            menu: newMenu
        }
    });
});

// All authenticated users can access this route i.e customers
exports.getAllMenus = asyncHandler(async (req, res, next) => {
    let query = Menu.find()
        .populate('restaurant'); // virtual populate on restaurant

    query = applyFiltering(query, req.query);
    query = applyFieldLimiting(query, req.query);
    query = applySorting(query, req.query);
    query = applyPagination(query, req.query);

    const menus = await query;

    if (menus.length === 0) {
        return next(new AppError('No matching records found.', 200));
    }

    res.status(200).json({
        status: 'success',
        results: menus.length,
        data: {
            menus
        }
    });
});

// Restricted to only restaurant owners.
exports.getAllMenusOfRestaurant = asyncHandler(async (req, res, next) => {
    
    const restaurant = await Restaurant.findOne({ owner: req.user.id });
    if (!restaurant) {
        return next(new AppError('Something went wrong. Please try again.', 500));
    }

    let query = Menu.find({ restaurant: restaurant._id })
        .populate('restaurant'); // virtual populate on restaurant

    query = applyFiltering(query, req.query);
    query = applyFieldLimiting(query, req.query);
    query = applySorting(query, req.query);
    query = applyPagination(query, req.query);

    const menus = await query;

    if (menus.length === 0) {
        return next(new AppError('No matching records found.', 200));
    }

    res.status(200).json({
        status: 'success',
        results: menus.length,
        data: {
            menus
        }
    });
});

// All authenticated users can access this route.
exports.getMenu = asyncHandler(async (req, res, next) => {
    const menu = await Menu.findById(req.params.id)
        .populate('restaurant');

    if (!menu) {
        return next(new AppError('Menu not found', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            menu
        }
    });
});

exports.getMenuOfRestaurant = asyncHandler(async (req, res, next) => {
    
    const restaurant = await Restaurant.findOne({ owner: req.user.id });
    if (!restaurant) {
        return next(new AppError('Something went wrong. Please try again.', 500));
    }

    const menu = await Menu.findOne({ _id: req.params.id, restaurant: restaurant._id })
        .populate('restaurant');

    if (!menu) {
        return next(new AppError('Menu not found', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            menu
        }
    });
});

// Only restaurant owner can edit menus but only the menus that
// belongs to their restaurant
exports.updateMenu = asyncHandler(async (req, res, next) => {

    // The best practice will be to get the restaurant ID and menu id from req.params
    // But the problem is that what if owner deliberately use another restaurant's id 
    // to edit their menus. I need to find out whether that is possible. If so, how 
    // to avoid it.

    // 18-jUNE-2025. 
    // I have found out that my implementation is correct and I should not
    // allow restaurant id to come from the URL.

    const restaurant = await Restaurant.findOne({ owner: req.user.id });
    if (!restaurant) {
        return next(new AppError('Something went wrong. Please try again.', 500));
    }

    // It is repetive, so I should not violate the DRY principle
    // const menu = await Menu.findOne({ _id: req.params.id, restaurant: restaurant._id });
    // if (!menu) {
    //     return next(new AppError('Menu not found.', 404));
    // }

    const allowedFields = [
        'name', 'description', 'price', 'category', 'availability',
        // 'images' to be implemented later as it will involve 
        // push operation and use of multer and/or cloudinary
        // and I am yet to learn about them.
    ];

    const updates = {};
    allowedFields.forEach((allowedField) => {
        if (req.body[allowedField]) {
            updates[allowedField] = req.body[allowedField];
        }
    });

    const updatedMenu = await Menu.findOneAndUpdate({ _id: req.params.id, restaurant: restaurant._id }, updates, {
        new: true,
        runValidators: true,
    });

    if (!updatedMenu) {
        return next(new AppError('Menu not found.', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            menu: updatedMenu
        }
    }); 
});

// Later on in real-world project, I may use soft delete.
exports.deleteMenu = asyncHandler(async (req, res, next) => {

    const restaurant = await Restaurant.findOne({ owner: req.user.id });
    if (!restaurant) {
        return next(new AppError('Something went wrong. Please try again.', 500));
    }

    const menu = await Menu.findOneAndDelete({ _id: req.params.id, restaurant: restaurant._id });
    if (!menu) {
        return next(new AppError('Menu not found.', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null
    })
});

exports.uploadMenuImage = asyncHandler(async (req, res, next) => {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
        return next(new AppError('Image is required.', 400));
    }
    // route: /:id/images/:imageIndex
    const restaurant = await Restaurant.findOne({ owner: req.user.id });
    if (!restaurant) {
        return next(new AppError('Restaurant not found.', 404));
    }

    const menu = await Menu.findOne({ _id: req.params.id, restaurant: restaurant._id });
    if (!menu) {
        return next(new AppError('Menu not found.', 404));
    }
    
    const index = Number(req.params.imageIndex)
    if (menu.images.length === 3 && !index) {
        return next(new AppError('Sorry, you can upload a maximum of 3 images per menu.', 400));
    }

    const result = await cloudinary.uploader.upload(imageBase64, {
        public_id: `${menu._id}-${Date.now()}`, // unique per image
        folder: 'menu-images',
        overwrite: true,
        transformation: [
            { quality: 'auto' },
            { fetch_format: 'auto' }
        ]
    });

    if (!index) {
        menu.images.push({ 
            imageUrl: result.secure_url, 
            imagePublicId: result.public_id 
        });
    
        await menu.save({ validateBeforeSave: false });
    
        return res.status(200).json({
            status: 'success',
            data: {
                menu
            }
        });
    }

    await cloudinary.uploader.destroy(menu.images[index].imagePublicId);
    menu.images[index] = {
        imageUrl: result.secure_url, 
        imagePublicId: result.public_id 
    }

    await menu.save({ validateBeforeSave: false });

    res.status(200).json({
        status: 'success',
            data: {
                menu
            }
    });

});

exports.deleteMenuImage = asyncHandler(async (req, res, next) => {
    
    // route: /api/v1/menus/:id/images/:imageIndex
    const restaurant = await Restaurant.findOne({ owner: req.user.id });
    if (!restaurant) {
        return next(new AppError('Restaurant not found.', 404));
    }
 
    const menu = await Menu.findOne({ _id: req.params.id, restaurant: restaurant._id });
    if (!menu) {
        return next(new AppError('Menu not found.', 404));
    }
 
    const index = Number(req.params.imageIndex)
 
    if (index <= 0 || index >= menu.images.length) {
        return next(new AppError('Invalid index', 400));
    }

    if (!menu.images[index]?.imagePublicId) {
        return next(new AppError('Image does\'t exist.', 400));
    }

    await cloudinary.uploader.destroy(menu.images[index].imagePublicId);

    menu.images = menu.images.filter((_, i) => i !== index);
    await menu.save({ validateBeforeSave: false });

    res.status(200).json({
        status: 'success',
        data: {
            menu
        }
    });
    
});

exports.uploadMultipleMenuImagesMulterAndStreaming = asyncHandler(async (req, res, next) => {
    const restaurant = await Restaurant.findOne({ owner: req.user.id });
    if (!restaurant) {
        return next(new AppError('Restaurant not found.', 404));
    }
 
    const menu = await Menu.findOne({ _id: req.params.id, restaurant: restaurant._id });
    if (!menu) {
        return next(new AppError('Menu not found.', 404));
    }


    if (menu.images?.length === 3) {
        return next(new AppError('Maximum of 3 images already uploaded for this menu. Please you may change any of the images.', 400));
    }

    if (!req.files || req.files.length === 0) {
        return next(new AppError('Please upload at least one menu image.', 400));
    }

    if (req.files.length > 3) {
        return next(new AppError('Only 3 images allowed per menu.', 400));
    }

    console.log(req.files);

    // VIP
    // Another thing I should control is that when for example there are 
    // 2 images already and user uploads another two, so I should allow 
    // only 1 image to be added without bothering user with any error message.
    // Let me implement it now. It will be a cool feature.

    let maxAllowedImages;
    if (menu.images) {
        maxAllowedImages = 3 - menu.images.length; 
    }

    req.files = req.files.filter((_, i) => i < maxAllowedImages);

    const totalSize = req.files.reduce((acc, { size }) => acc + size, 0);
    if (totalSize > (5 * 1024 * 1024)) {
        return next(new AppError('Total image size too large, 5MB or less.', 400));
    }

    const streamUpload = (fileBuffer, index) => {
        return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    resource_type: 'image',
                    folder: 'menu-images',
                    public_id: `${menu._id}-${Date.now()}-${index}`,
                    overwrite: true,
                    transformation: [
                        { quality: 'auto' },
                        { fetch_format: 'auto' }
                    ]
                },
                (err, result) => {
                    if (result) resolve(result);
                    else reject(err);
                }
            )

            streamifier.createReadStream(fileBuffer).pipe(stream);
        });
    };

    let results;
    try {
        const menuPromises = req.files.map((file, i) => streamUpload(file.buffer, i));

        results = await Promise.all(menuPromises);
    } catch(err) {
        console.error('Cloudinary error for menu image upload', err);

        // Send email to developer (myself) if on production.
        return next(new AppError('Image(s) upload failed. Please try again.', 500));
    }

    menu.images.push(
        ...results.map((result) => {
        return { 
            imageUrl: result.secure_url,
            imagePublicId: result.public_id
        };
    }));

    await menu.save({ validateBeforeSave: false });

    res.status(200).json({
        status: 'success',
        data: {
            menu
        }
    });
});