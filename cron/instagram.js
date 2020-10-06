const CronJob = require('cron').CronJob;

const Instagram = require('../models/Instagram');
const inst = require('../helpers/instagram');

const instagramSubUnsub = new CronJob('10 */12 * * *', async function () {
    try {
        const accounts = await Instagram.find();

        for (const { name, password, countSubscribe, countUnSubscribe, active } of accounts) {
        	if (name && password && active && (countSubscribe || countUnSubscribe)) {
                await inst.initialize();
                await inst.login(name, password);

                if (countSubscribe) await inst.subscribe(countSubscribe);
                if (countUnSubscribe) await inst.unsubscribe(name, countUnSubscribe);

                await inst.close();
            }
        }
    } catch (e) {
        console.log(e)
    }
}, null, true, 'Europe/Moscow');

const instagramLikes = new CronJob('*/30 * * * *', async function () {
    try {
        const accounts = await Instagram.find();

        for (const { name, password, countLikes, active, tagLikes = [] } of accounts) {
        	if (name && password && tagLikes.length > 0 && active) {
                await inst.initialize(false);
                await inst.login(name, password);
                await inst.liked(tagLikes, countLikes);
                await inst.close();
            }
        }
    } catch (e) {
        console.log(e)
    }
}, null, true, 'Europe/Moscow');


const test = async () => {
	try {
        const accounts = await Instagram.find();

        for (const { name, password, countLikes, tagLikes = [], tested } of accounts) {
        	if (name && password && tagLikes.length > 0 && tested) {
                await inst.initialize(false);
                await inst.login(name, password);
                await inst.liked(tagLikes, 1);
                await inst.close();
            }
        }
    } catch (e) {
        console.log(e)
    }
};

// test();

instagramSubUnsub.start();
instagramLikes.start();