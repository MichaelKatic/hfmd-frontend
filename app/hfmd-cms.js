import dotenv from 'dotenv'
import https from 'https'
import http from 'http'

dotenv.config() //Allows usage of process.env.YOUR_VARS

const apiGetToken = process.env.HFMD_API_TOKEN
const baseUrl = process.env.HFMD_URL

const get = (path) => new Promise((resolve, reject) => {
    const url = baseUrl + path

    let protocol = https

    if (baseUrl.startsWith('http://localhost')) {
        protocol = http
    }
    
    const options = {
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${apiGetToken}`
        }
    }
    protocol.get(url, options, (res) => {
        console.log({
            url: url,
            statusCode: res.statusCode,
            headers: res.headers,
        });

        res.on('data', (d) => {
            process.stdout.write(d);
        });

        res.setEncoding('utf8');
        let rawData = '';

        res.on('data', (chunk) => {
            rawData += chunk;
        });

        res.on('end', () => {
            try {
                const parsedData = JSON.parse(rawData);
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(parsedData)
                } else {
                    reject(parsedData.error)
                }
            } catch (error) {
                reject(error)
            }
        });
    }).on('error', (error) => {
        reject(error)
    });
});

export default {
    get
}