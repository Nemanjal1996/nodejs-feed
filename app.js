const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');

const app = express();

const bodyparser = require('body-parser');

const API_PORT = 8080;
const MONGO_URI = 'mongodb://admin:nemanja1996@ds153495.mlab.com:53495/nodejs-feed';

const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        cb(null, true);
    } else { 
        cb(null, false);
    }
}

app.use(bodyparser.json());
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(
    multer({ 
        storage: fileStorage, 
        fileFilter: fileFilter
    }).single('image')
);

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-type, Authorixation');
    next();
});

app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);

app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;

    res.status(status).json({
        message: message, 
        data: data
    })

})

mongoose
    .connect(MONGO_URI, { useNewUrlParser: true })
    .then(() => {
        const server = app.listen(API_PORT);
        const io = require('./socket').init(server);
        io.on('connect', socket => {
            console.log('Client connected');
        });
    })
    .catch(err => {
        console.log(err);
    });
