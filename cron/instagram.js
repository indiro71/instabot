const CronJob = require('cron').CronJob;

const Instagram = require('../models/Instagram');
const instagram = require('../helpers/Instagram');

const instagramSubUnsub = new CronJob('10 */12 * * *', async function () {
    try {
        const accounts = await Instagram.find();

        for (const { name, password, countSubscribe, countUnSubscribe, active } of accounts) {
        	if (name && password && active && (countSubscribe || countUnSubscribe)) {

            }
        }
    } catch (e) {
        console.log(e)
    }
}, null, true, 'Europe/Moscow');

const instagramLikes = new CronJob('*/30 * * * *', async function () {
    try {
        const accounts = await Instagram.find();

        for (const account of accounts) {
        	if (account.name && account.password && account.tagLikes.length > 0 && account.active) {
                const inst = new instagram(account);
                await inst.clickLikes();
            }
        }
    } catch (e) {
        console.log(e)
    }
}, null, true, 'Europe/Moscow');


const test = async () => {
	try {
        const accounts = await Instagram.find();

        for (const account of accounts) {
        	if (account.name && account.password && account.tagLikes.length > 0 && account.active) {
                const inst = new instagram(account);
                await inst.clickLikes();
            }
        }
    } catch (e) {
        console.log(e)
    }
};

// test();

// instagramSubUnsub.start();
instagramLikes.start();