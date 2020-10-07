const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');

class Instagram {
    constructor(account, mobile = true, useProxy = false) {
        this.name = account.name;
        this.password = account.password;
        this.countSubscribe = account.countSubscribe || 5;
        this.countUnSubscribe = account.countUnSubscribe || 5;
        this.tested = account.tested || false;
        this.countLikes = this.tested ? 1 : account.countLikes || 5;
        this.tagLikes = account.tagLikes || [];
        this.active = account.active || true;
        this.private = account.private || true;

        this.mobile = mobile;
        this.useProxy = useProxy;
        this.headless = false;//!this.tested;

        this.browser = 'null';
        this.page = null;
        this.base_url = 'https://www.instagram.com';
        this.user_agent = 'Mozilla/5.0 (Linux; Android 8.0.0; SM-G960F Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.84 Mobile Safari/537.36';
    }

    async initialize() {
        const options = {};
        options.headless = this.headless;

        if (this.mobile) {
            options.defaultViewport = {
                width: 320,
                height: 570
            }
        }

        options.args = [
            '--no-sandbox',
            '--lang=en-EN,en'
        ];

        if (this.useProxy) {
            options.args.push('--proxy-server=IP:PORT');
        }

        this.browser = await puppeteer.launch(options);
        this.page = await this.browser.newPage();

        if (this.useProxy) {
            await this.page.authenticate({
                username: 'username',
                password: 'password',
            });
        }

        await this.page.setExtraHTTPHeaders({
            'Accept-Language': 'en'
        });

        if (this.mobile) {
            await this.page.setUserAgent(this.user_agent);
        }
    }

    async login() {
        try {
            if (this.name && this.password) {
                await this.page.goto(`${this.base_url}/accounts/login/?source=auth_switcher`, { waitUntil: 'networkidle2' });
                await this.page.waitForSelector('input[name="username"]');

                await this.page.type('input[name="username"]', this.name, { delay: 10 });
                await this.page.type('input[name="password"]', this.password, { delay: 10 });
                await this.page.click('button[type="submit"]');

                await this.page.waitForXPath('//button[contains(text(),\'Save Info\')]');
                await this.page.screenshot({ path: 'temp/afterLoginPage.png' });
            }
        } catch (e) {
            console.log(e);
            await this.close();
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
            await this.close();
        }
    }

    async unsubscribe() {
        if (!this.countUnSubscribe) return false;

        try {
            await this.page.goto(`${this.base_url}/${this.name}/`);
            await this.page.waitForSelector('img[alt="Change Profile Photo"]');

            const subsButton = await this.page.$x('//a[text()[contains(.,"following")]]');
            await subsButton[0].click();

            await this.page.waitForXPath("//button[contains(text(),'Following')]");
            const buttons = await this.page.$x("//button[contains(text(),'Following')]");

            for (let i = 0; i < this.countUnSubscribe; i++) {
                let button = buttons[i];

                await button.click();
                await this.page.waitForXPath("//button[contains(text(),'Unfollow')]");
                const unsubButton = await this.page.$x("//button[contains(text(),'Unfollow')]");
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

            const filePath = 'temp/newpost.jpg';
            const file = fs.createWriteStream(filePath);
            const request = http.get(imgUrl.replace('https', 'http'), function(response) {
                response.pipe(file);
            });

            await this.page.goto(`${this.base_url}/${this.name}/`);
            await this.page.waitForSelector('img[alt="Change Profile Photo"]');

            await this.page.waitForSelector("input[type='file']");
            let fileInputs = await this.page.$$('input[type="file"]');
            let input = fileInputs[fileInputs.length-1];

            await this.page.click("[aria-label='New Post']");
            await this.page.waitFor(3000);

            await input.uploadFile(filePath);
            await this.page.waitFor(10000);

            await this.page.waitForXPath("//button[contains(text(),'Next')]");
            let next = await this.page.$x("//button[contains(text(),'Next')]");
            await next[0].click();

            if (caption) {
                await this.page.waitForSelector("textarea[aria-label='Write a caption…']");
                await this.page.click("textarea[aria-label='Write a caption…']");
                await this.page.keyboard.type(caption);
            }

            await this.page.waitForXPath("//button[contains(text(),'Share')]");
            let share = await this.page.$x("//button[contains(text(),'Share')]");
            await share[0].click();

            await this.page.waitFor(10000);
        } catch (e) {
            console.log(e);
            await this.close();
        }
    }

    async liked() {
        if (this.tagLikes.length === 0) return false;

        try {
            for (let tag of this.tagLikes) {
                await this.page.goto(`${this.base_url}/explore/tags/${tag}/`);
                await this.page.waitForSelector("article > div img");

                // const images = await instagram.page.$$('article div img[decoding="auto"]'); // top posts
                const images = await this.page.$$('article>div:nth-child(3) img[decoding="auto"]');    //most recent posts

                for (let i = 0; i < this.countLikes; i++) {
                    let image = images[i];

                    await image.click();

                    await this.page.waitForSelector('button[aria-hidden="true"]');
                    await this.page.waitForSelector('button svg[aria-label="Share Post"]');

                    if (await this.page.$('span svg[aria-label="Like"]')) {
                        await this.page.click('span svg[aria-label="Like"]');
                    }

                    await this.page.click('button svg[aria-label="Close"]');
                }
            }
        } catch (e) {
            console.log(e);
            await this.close();
        }
    }

    async close() {
        await this.browser.close();
    }

    async clickLikes() {
        this.mobile = false;
        await this.initialize();
        await this.login();
        await this.liked();
        await this.close();
    }
}

module.exports = Instagram;