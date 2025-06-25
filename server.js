const dotenv = require('dotenv');
dotenv.config({
    path: './config.env'
});

// Handling Uncaught Exceptions
process.on('uncaughtException', err => {
    console.log(err.name, err.message);
    console.log('UNCAUGHT EXCEPTION 🔥. Shutting down...');

    process.exit(1);
});

const app = require('./app');
const { connectToDB } = require('./db/db');

// DB Connection
connectToDB(process.env.MONGO_URI);

// Server Configuration
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}`);
});

// Handling Unhadled Rejections
process.on('unhandledRejection', err => {
    console.log(err.name, err.message);
    console.log('UNHANDLED REJECTION 🔥. Shutting down...');

    server.close(() => {
        process.exit(1);
    });
});