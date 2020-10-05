const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('./cron/');

const app = express();

const {MONGODB_URI} = require('./keys');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

async function  start() {
    try {
        await mongoose.connect(MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});
        const PORT = process.env.PORT || 7171;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}...`);
        });
    } catch (e) {
        console.log(e);
    }
}
start();

