const puppeteer = require('puppeteer');

const LAUNCH_PUPPETEER_OPTS = {
    headless: true,
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080',
        '--lang=en-EN,en'
    ]
};

const PAGE_PUPPETEER_OPTS = {
    networkIdle2Timeout: 5000,
    waitUntil: 'networkidle2',
    timeout: 30000
};

class Parser {
    constructor() {
        this.browser = null;
    }
    async initBrowser() {
        this.browser = await puppeteer.launch(LAUNCH_PUPPETEER_OPTS);
    }
    closeBrowser() {
        this.browser.close();
    }
    async getPageContent(url) {
        if (!this.browser) {
            await this.initBrowser();
        }

        try {
            const page = await this.browser.newPage();
            await page.goto(url, PAGE_PUPPETEER_OPTS);
            const content = await page.content();
            await this.closeBrowser();
            return content;
        } catch (err) {
            throw err;
        }
    }
}

module.exports = Parser;