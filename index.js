const path = require('path')
const { promisify } = require('util')
const fs = require('fs');
const request = require('request');

let urls = []

const readFileAsync = promisify(fs.readFile)

const download = (url, dest, cb) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        const sendReq = request.get(url);

        // verify response code
        sendReq.on('response', (response) => {
            if (response.statusCode !== 200) {
                return cb('Response status was ' + response.statusCode);
            }

            sendReq.pipe(file);
        });

        // close() is async, call cb after close completes
        file.on('finish', () => {
            file.close(cb)
            resolve(`Completed - ${dest}`)
        });

        // check for request errors
        sendReq.on('error', (err) => {
            fs.unlink(dest, () => cb(err.message)); // delete the (partial) file and then return the error
            reject(`Error: ${err.message} - ${dest}`)
        });

        file.on('error', (err) => { // Handle errors
            fs.unlink(dest, () => cb(err.message)); // delete the (partial) file and then return the error
            reject(`Error: ${err.message} - ${dest}`)
        });
    })

};

function getFilenameFromUrl(url) {
    const pathname = new URL(url).pathname;
    const index = pathname.lastIndexOf('/');
    return (-1 !== index) ? pathname.substring(index + 1) : pathname;
}



async function findNames(urls) {
    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        let name = getFilenameFromUrl(url)
        const filePath = path.join(__dirname, 'downloads', name)
        console.log(`[downloading filePath]: `, filePath);
        try {
            let res = await download(url, filePath, (err) => callback(err, filePath))
        } catch (error) {
            console.log(`[error]: `, error);
        }
    }
}


function callback(err, filePath) {
    if (err) {
        console.log(`[Error]: `, err, filePath);
        return
    }
    console.log(`[File done]: `, filePath);
}

readFileAsync(`${__dirname}/urls.json`, { encoding: 'utf8' })
    .then(contents => {
        urls = JSON.parse(contents)
        findNames(urls)
    })
    .catch(error => {
        throw error
    })