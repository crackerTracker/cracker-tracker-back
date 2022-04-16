const express = require('express')
const config = require('config')
require('dotenv').config()
const path = require('path')
const mongoose = require('mongoose')
const initRoutes = require('./routes');

const app = express();

app.use(express.json({ extended: true }))

initRoutes(app);

const PORT = config.get('port') || 5000;

async function start() {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
        app.listen(PORT, () => console.log(`App has been started on port ${PORT}...`))
    } catch (e) {
        console.log('Server Error', e.message)
        process.exit(1)
    }
}

start();