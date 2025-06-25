const mongoose = require('mongoose');

exports.connectToDB = async (uri) => {
    try {
        await mongoose.connect(uri);
        console.log('DB Connection Successful.');
    } catch (err) {
        console.log(err);
        console.log('DB Connection failed.');
    }
};