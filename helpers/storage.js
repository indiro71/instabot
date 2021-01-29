const needle = require('needle');
const fs = require('fs');
const keys = require("../keys");
const manager = require('node-selectel-manager')({
    login: keys.STORAGE_LOGIN,
    password: keys.STORAGE_PASSWORD
});

const storage = keys.STORAGE_NAME;
const defaultDirectory = `images`;

module.exports = {
    async uploadFile(url, directory = defaultDirectory) {
        const fileUrl = url.indexOf('https') !== -1 ? url : 'https:' + url;

        if (fileUrl.indexOf('https') !== -1) {
            const httpOptions = {};
            const fileName = fileUrl.split('/').pop();

            needle.get(fileUrl, httpOptions, function (err, response) {
                if (err || response.statusCode !== 200)
                    throw err || response.statusCode;
                if (response.body && fileName) {
                    manager.uploadFile(response.body, `${storage}/${directory}/${fileName}`);
                }
            });
        }
    },
    async uploadLocalFile(filePath, directory = defaultDirectory) {
        if (filePath) {
            const file = fs.readFileSync(process.cwd() + filePath);
            const fileName = filePath.split('/').pop();

            if (file && fileName) {
                manager.uploadFile(file, `${storage}/${directory}/${fileName}`);
            }
        }
    }
}
