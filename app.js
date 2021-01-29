const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const log4js = require("log4js");
const initInst = require("./cron/instagram");

const app = express();

const {MONGODB_URI} = require('./keys');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

log4js.configure(
    {
        appenders: {
            file: {
                type: 'file',
                filename: 'logs/logger.log',
                maxLogSize: 10 * 1024 * 1024, // = 10Mb
                encoding: 'utf-8',
                mode: 0o0640,
                flags: 'w+'
            }
        },
        categories: {
            default: { appenders: ['file'], level: 'trace' }
        }
    }
);

const logger = log4js.getLogger('server');

async function  start() {
    try {
        await mongoose.connect(MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});
        const PORT = process.env.PORT || 7171;
        app.listen(PORT, () => {
            initInst();
            logger.info(`Server running on port ${PORT}...`);
            console.log(`Server running on port ${PORT}...`);
        });
    } catch (e) {
        console.log(e);
    }
}
start();

