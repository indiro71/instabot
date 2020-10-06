const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');

const BASE_URL = 'https://www.instagram.com';
const USER_AGENT = "Mozilla/5.0 (Linux; Android 8.0.0; SM-G960F Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.84 Mobile Safari/537.36";

const instagram = {
    browser: null,
    page: null,

    initialize: async (mobile = true) => {
        const options = {};
        options.headless = false;
        if (mobile) {
            options.defaultViewport = {
                width: 320,
                height: 570
            }
        }

        options.args = [
            '--no-sandbox',
            '--lang=en-EN,en',
            // '--proxy-server=IP:PORT'
        ]

        instagram.browser = await puppeteer.launch(options);

        instagram.page = await instagram.browser.newPage();

        // await instagram.page.authenticate({
        //     username: 'username',
        //     password: 'password',
        // });

        await instagram.page.setExtraHTTPHeaders({
            'Accept-Language': 'en'
        });

        if (mobile) {
            instagram.page.setUserAgent(USER_AGENT);
        }
    },

    login: async (name, password) => {
        await instagram.page.goto(`${BASE_URL}/accounts/login/?source=auth_switcher`, {waitUntil: 'networkidle2'});

        await instagram.page.waitForSelector('input[name="username"]');
        await instagram.page.type('input[name="username"]', name, {delay: 10});
        await instagram.page.type('input[name="password"]', password, {delay: 10});
        await instagram.page.click('button[type="submit"]');

        await instagram.page.waitForXPath("//button[contains(text(),'Save Info')]");
        await instagram.page.screenshot({path: 'temp/afterLoginPage.png'});
    },

    subscribe: async (count = 5) => {
        await instagram.page.goto(`${BASE_URL}/explore/people/suggested/`);
        await instagram.page.waitForXPath("//button[contains(text(),'Follow')]");

        const buttons = await instagram.page.$x("//button[contains(text(),'Follow')]");

        for (let i = 0; i < count; i++) {
            let button = buttons[i];
            await button.click();
        }

        await instagram.page.waitFor(2000);
    },

    unsubscribe: async (profile, count = 5) => {
        await instagram.page.goto(`${BASE_URL}/${profile}/`);
        await instagram.page.waitForSelector('img[alt="Change Profile Photo"]');

        const subsButton = await instagram.page.$x('//a[text()[contains(.,"following")]]');
        await subsButton[0].click();

        await instagram.page.waitForXPath("//button[contains(text(),'Following')]");
        const buttons = await instagram.page.$x("//button[contains(text(),'Following')]");

        for (let i = 0; i < count; i++) {
            let button = buttons[i];

            await button.click();
            await instagram.page.waitForXPath("//button[contains(text(),'Unfollow')]");
            const unsubButton = await instagram.page.$x("//button[contains(text(),'Unfollow')]");
            await unsubButton[0].click();
        }

        await instagram.page.waitFor(2000);
    },

    postData: async (img, caption = '') => {
        if (!img) return false;

        await instagram.liked(['cars'], 1);

        const filePath = 'temp/DSC0023421.jpg';
        const file = fs.createWriteStream(filePath);
        const request = http.get(img.replace('https', 'http'), function(response) {
            response.pipe(file);
        });

        await instagram.page.goto(`${BASE_URL}`);
        await instagram.page.waitFor(2000);

        await instagram.page.waitForSelector("input[type='file']");
        let fileInputs = await instagram.page.$$('input[type="file"]');
        let input = fileInputs[fileInputs.length-1];

        await instagram.page.click("[aria-label='New Post']");
        await instagram.page.waitFor(3000);

        await input.uploadFile(filePath);
        await instagram.page.waitFor(10000);

        await instagram.page.waitForXPath("//button[contains(text(),'Next')]");
        let next = await instagram.page.$x("//button[contains(text(),'Next')]");
        await next[0].click();

        if (caption) {
            await instagram.page.waitForSelector("textarea[aria-label='Write a caption…']");
            await instagram.page.click("textarea[aria-label='Write a caption…']");
            await instagram.page.keyboard.type(caption);
        }

        await instagram.page.waitForXPath("//button[contains(text(),'Share')]");
        let share = await instagram.page.$x("//button[contains(text(),'Share')]");
        await share[0].click();

        await instagram.page.waitFor(10000);
    },

    liked: async (tags = [], count = 9) => {
        if(tags.length === 0) return false;

        for(let tag of tags) {
            await instagram.page.goto(`${BASE_URL}/explore/tags/${tag}/`);
            await instagram.page.waitForSelector("article > div img");

            // const images = await instagram.page.$$('article div img[decoding="auto"]'); // top posts
            const images = await instagram.page.$$('article>div:nth-child(3) img[decoding="auto"]');    //most recent posts

            for (let i = 0; i < count; i++) {
                let image = images[i];

                await image.click();

                await instagram.page.waitForSelector('button[aria-hidden="true"]');
                await instagram.page.waitForSelector('span svg[aria-label="Comment"]');

                if (await instagram.page.$('span svg[aria-label="Like"]')) {
                  await instagram.page.click('span svg[aria-label="Like"]');
                }

                await instagram.page.click('button svg[aria-label="Close"]');
            }
        }
    },

    close: async () => {
        await instagram.browser.close();
        await instagram.page.waitFor(90000);
    }
}

module.exports = instagram;