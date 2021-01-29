const log4js = require('log4js');
const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const random = require('random');
const logger = log4js.getLogger('instaBot');

class Instagram {
    constructor(account, mobile = true, useProxy = false) {
        this.name = account.name;
        this.password = account.password;
        this.countSubscribe = account.countSubscribe || 5;
        this.countUnSubscribe = account.countUnSubscribe || 5;
        this.tested = account.tested || false;
        this.countLikes = account.countLikes || 5;
        this.tagLikes = account.tagLikes || [];
        this.active = account.active || true;
        this.private = account.private || true;

        this.mobile = mobile;
        this.useProxy = useProxy;
        this.headless = !this.tested;

        this.browser = 'null';
        this.page = null;
        this.base_url = 'https://www.instagram.com';
        this.user_mobile_agent = 'Mozilla/5.0 (Linux; Android 8.0.0; SM-G960F Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.84 Mobile Safari/537.36';
        this.user_desktop_agent = 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36';
    }

    async initialize() {
        logger.info('init start');
        const options = {};
        options.headless = this.headless;

        options.defaultViewport = {
            width: this.mobile ? 320 : 1920,
            height: this.mobile ? 570 : 1080
        };

        options.args = [
            '--no-sandbox',
            '--lang=en-EN,en'
        ];

        if (this.useProxy) {
            options.args.push('--proxy-server=IP:PORT');
        }

        this.browser = await puppeteer.launch(options);

        logger.info('init end');
    }

    async newPage() {
        this.page = await this.browser.newPage();

        if (this.useProxy) {
            await this.page.authenticate({
                username: 'username',
                password: 'pass',
            });
        }

        await this.page.setExtraHTTPHeaders({
            'Accept-Language': 'en'
        });

        if (this.mobile) {
            await this.page.setUserAgent(this.user_mobile_agent);
        } else {
            await this.page.setUserAgent(this.user_desktop_agent);
        }
    }

    async closePage() {
        await this.page.close();
    }

    async setMobile() {
        await this.page.setUserAgent(this.user_mobile_agent);
        await this.page.setViewport({ width: 320, height: 570 });
        await this.page.reload();
        this.mobile = true;
    }

    async setDesktop() {
        await this.page.setUserAgent(this.user_desktop_agent);
        await this.page.setViewport({ width: 1920, height: 1080 });
        await this.page.reload();
        this.mobile = false;
    }

    async goTo(url) {
        await this.page.goto(url, { waitUntil: 'networkidle2' });
    }

    async login() {
        logger.info('login start');
        await this.newPage();
        try {
            if (this.name && this.password) {
                await this.page.goto(`${this.base_url}/accounts/login/?source=auth_switcher`, { waitUntil: 'networkidle2' });
                await this.page.screenshot({ path: 'temp/loginPage.png' });

                await this.page.waitForSelector('input[name="username"]');

                await this.page.type('input[name="username"]', this.name, { delay: 50 });
                await this.page.type('input[name="password"]', this.password, { delay: 100 });
                await this.page.click('button[type="submit"]');

                await this.page.waitForXPath('//button[contains(text(),\'Save Info\')]');
                await this.page.screenshot({ path: 'temp/afterLoginPage.png' });
                logger.info('login end');

                await this.wait(3000);
                await this.closePage();
            }
        } catch (e) {
            logger.info('login error', e);
            await this.closePage();
        }
    }

    async subscribe() {
        if (!this.countSubscribe) return false;

        try {
            await this.page.goto(`${this.base_url}/explore/people/suggested/`);
            await this.page.waitForXPath('//button[contains(text(),\'Follow\')]');

            const buttons = await this.page.$x('//button[contains(text(),\'Follow\')]');

            for (let i = 0; i < this.countSubscribe; i++) {
                let button = buttons[i];
                await button.click();
            }
        } catch (e) {
            console.log(e);
            await this.closePage();
        }
    }

    async unsubscribe() {
        if (!this.countUnSubscribe) return false;

        try {
            await this.page.goto(`${this.base_url}/${this.name}/`);
            await this.page.waitForSelector('img[alt="Change Profile Photo"]');

            const subsButton = await this.page.$x('//a[text()[contains(.,"following")]]');
            await subsButton[0].click();

            await this.page.waitForXPath('//button[contains(text(),\'Following\')]');
            const buttons = await this.page.$x('//button[contains(text(),\'Following\')]');

            for (let i = 0; i < this.countUnSubscribe; i++) {
                let button = buttons[i];

                await button.click();
                await this.page.waitForXPath('//button[contains(text(),\'Unfollow\')]');
                const unsubButton = await this.page.$x('//button[contains(text(),\'Unfollow\')]');
                await unsubButton[0].click();
            }
        } catch (e) {
            console.log(e);
            await this.close();
        }
    }

    async postdata(imgUrl, caption = '') {
        if (!imgUrl) return false;

        try {
            await this.liked();
            if (!this.mobile) await this.setMobile();

            const filePath = 'temp/newpost.jpg';
            const file = fs.createWriteStream(filePath);
            const request = http.get(imgUrl.replace('https', 'http'), function (response) {
                response.pipe(file);
            });

            await this.page.goto(`${this.base_url}/${this.name}/`);
            await this.page.waitForSelector('img[alt="Change Profile Photo"]');

            await this.page.waitForSelector('input[type=\'file\']');
            let fileInputs = await this.page.$$('input[type="file"]');
            let input = fileInputs[fileInputs.length - 1];

            await this.page.click('[aria-label=\'New Post\']');
            await this.page.waitFor(3000);

            await input.uploadFile(filePath);
            await this.page.waitFor(10000);

            await this.page.waitForXPath('//button[contains(text(),\'Next\')]');
            let next = await this.page.$x('//button[contains(text(),\'Next\')]');
            await next[0].click();

            if (caption) {
                await this.page.waitForSelector('textarea[aria-label=\'Write a caption…\']');
                await this.page.click('textarea[aria-label=\'Write a caption…\']');
                await this.page.keyboard.type(caption);
            }

            await this.page.waitForXPath('//button[contains(text(),\'Share\')]');
            let share = await this.page.$x('//button[contains(text(),\'Share\')]');
            await share[0].click();

            await this.page.waitFor(10000);
        } catch (e) {
            console.log(e);
            await this.closePage();
        }
    }
    async getLinks() {
        if (this.tagLikes.length === 0) return false;
        if (this.mobile) await this.setDesktop();
        await this.newPage();

        try {
            const links = [];
            for (let tag of this.tagLikes) {
                await this.page.goto(`${this.base_url}/explore/tags/${tag}/`);
                await this.page.waitForSelector('article > div img');

                await this.wait(2000, 10000);

                const pageLinks = await this.page.$$eval('article>div:nth-child(3) a', anchors => [].map.call(anchors, a => a.href));    //most recent posts
                pageLinks.map((link, index) => {
                    if (index < this.countLikes) {
                        links.push(link)
                    }
                });

            }

            for (let i = 0; i < links.length; i++) {
                let link = links[i];

                await this.page.goto(link);
                await this.page.waitForSelector('article > div img');

                await this.wait(2000, 5000);

                if (random.int(1, 7) !== 1) {
                    if (await this.page.$('span svg[aria-label="Like"]')) {
                        await this.page.click('span svg[aria-label="Like"]');
                    }
                }

                await this.wait(2000, 7000);
            }

            logger.info('Likes clicked');
            await this.page.screenshot({ path: 'temp/afterLike.png' });
            await this.closePage();
        } catch (e) {
            await this.page.screenshot({ path: 'temp/likesError.png' });
            logger.info('Likes error', e);
            await this.closePage();
        }
    }

    async liked() {
        if (this.tagLikes.length === 0) return false;
        if (this.mobile) await this.setDesktop();
        await this.newPage();


        try {
            for (let tag of this.tagLikes) {
                await this.page.goto(`${this.base_url}/explore/tags/${tag}/`);
                await this.page.waitForSelector('article > div img');

                await this.wait(2000, 10000);

                // const images = await instagram.page.$$('article div img[decoding="auto"]'); // top posts
                const images = await this.page.$$('article>div:nth-child(3) img[decoding="auto"]');    //most recent posts


                for (let i = 0; i < this.countLikes; i++) {
                    let image = images[i];

                    await image.click();

                    await this.wait(2000, 5000);

                    if (!await this.page.$('button[aria-hidden="true"]')) {
                        await this.page.screenshot({ path: 'temp/hiddenError(' + i + ').png' });
                        logger.error('Instagram error with button[aria-hidden="true"]');
                        break;
                    }

                    await this.wait(2000, 5000);

                    if (random.int(1, 7) !== 1) {
                        if (await this.page.$('span svg[aria-label="Like"]')) {
                            await this.page.click('span svg[aria-label="Like"]');
                        }
                    }

                    await this.wait(2000, 5000);

                    if (await this.page.$('button svg[aria-label="Close"]')) {
                        await this.page.click('button svg[aria-label="Close"]');
                    } else {
                        break;
                    }

                    await this.wait(2000, 5000);
                }
            }
            logger.info('Likes clicked');
            await this.page.screenshot({ path: 'temp/afterLike.png' });
            await this.closePage();
        } catch (e) {
            await this.page.screenshot({ path: 'temp/likesError.png' });
            logger.info('Likes error', e);
            await this.closePage();
        }
    }

    async wait(min = 0, max = 0) {
        if (min === 0) return false;

        await this.page.waitFor(max > 0 ? random.int(min, max) : min);
    }

    async closeBrowser() {
        await this.browser.close();
    }
}

module.exports = Instagram;