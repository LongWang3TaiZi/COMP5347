var express = require('express');
var path = require('path');
const cors = require('cors');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const swaggerConfig = require('./config/swagger');
const errorHandler = require('./middlewares/errorHandler');
const session = require('express-session');
const MongoStore = require('connect-mongo');
require('dotenv').config();
var dbInitRouter = require('./routes/dbInit');
var adminUserRouter = require('./routes/admin/adminRoutes');
const userRouter = require('./routes/user/userRouter');
const profileRouter = require('./routes/user/profileRouter');
const phoneRoutes = require('./routes/phoneRoutes');
const cartRouter = require('./routes/cart/cartRoute');
const wishlistRouter = require('./routes/cart/wishlistRoute');
const orderRouter = require('./routes/order/orderRoute');
var app = express();

app.use(logger('dev'));

const corsOptions = {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, 
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// MongoDB session store setup
const mongoStore = MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/old-phone-deals',
    ttl: 24 * 60 * 60 // 1 day
});

// common session options
const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'old-phone-deals-default-secret-key',
    resave: false,
    saveUninitialized: false,
    store: mongoStore
};

// admin session middleware (only applied to admin routes)
app.use('/api/admin', session({
    ...sessionConfig,
    name: 'admin_sid',
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        path: '/',
        httpOnly: true,
        sameSite: 'lax'
    }
}));

// user session middleware (applied to all non-admin routes)
app.use(session({
    ...sessionConfig,
    name: 'user_sid',
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        path: '/',
        httpOnly: true,
        sameSite: 'lax' 
    }
}));

app.use(cookieParser());
// Increase request body size limit to support larger image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api-docs', swaggerConfig.serve, swaggerConfig.setup);
app.use('/api/admin', dbInitRouter, adminUserRouter);
app.use('/api/user', userRouter);
app.use('/api/user/profile', profileRouter);
app.use('/api/phone', phoneRoutes);

app.use('/api/user/:userId/cart', cartRouter);
app.use('/api/user/:userId/wishlist', wishlistRouter);
app.use('/api', orderRouter);


app.get('/ws', (req, res) => {
    res.send('WebSocket endpoint');
});

app.use(errorHandler);

module.exports = app;
