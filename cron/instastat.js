const CronJob = require('cron').CronJob;
const cheerio = require('cheerio');

const Instagram = require('../models/Instagram');
const Parser = require('../helpers/parser');

const getInstaStat = new CronJob('10 21 * * *', async function () {
    try {
        const accounts = await Instagram.find();

        for (let account of accounts) {
            const userUrl = `https://www.instagram.com/${account.name}/`;
            const parser = new Parser();

            const content = await parser.getPageContent(userUrl);
            const $ = cheerio.load(content);
            const data = $('meta[name="description"]').attr('content').split(', ');

            const followers = parseInt(data[0]);
            const following = parseInt(data[1]);
            const posts = parseInt(data[2]);
            const stats = { posts, followers, following, date: Date.now() };

            account.stats.push(stats);
            await account.save();
        }
    } catch (e) {
        console.log(e)
    }
}, null, true, 'Europe/Moscow');

getInstaStat.start();
