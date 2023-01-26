const globalName = 'sk8ermike'
const globalDataName = 'sk8ermikeData'
const globalAppName = 'sk8ermikeApp'

export default class Sk8erMike {
    
    static get globalName() { return typeof window !== 'undefined' ? 'window' : 'global' }
    static get global() { return typeof window !== 'undefined' ? window : global }
    static get clientSide() { return typeof window !== 'undefined' }
    static get serverSide() { return typeof global !== 'undefined' }
    static get instance() { return Sk8erMike.global[globalName] } 
    static set instance(value) { Sk8erMike.global[globalName] = value }

    constructor() {
        if (!this.instance) {
            this.instance = this
        }

        return this.instance;
    }
}

let clientInterface = {}
let serverInterface = {}

if (Sk8erMike.clientSide) {
    clientInterface = {
        http: {
            get: (url) => {
                const xhttp = new XMLHttpRequest()
                xhttp.open('GET', url, false)
                xhttp.send()
                return JSON.parse(xhttp.responseText)
            },
            getPromise: (url) => new Promise((resolve, reject) => {
                const response = clientInterface.http.get(url)
                if (response.error)
                {
                    response.url = url
                    reject(response)
                }
                resolve(response)
            })
        },
        req: {
            routePattern: window[globalDataName].routePattern,
            params: window[globalDataName].params
        }
    }
}
            
if (Sk8erMike.serverSide) {
    serverInterface = {
        http: {
            get: () => { }, // No non-promise version of get server-side. 
            getPromise: (url) => new Promise(async (resolve, reject) => {
                const https = await import('https');
                const http = await import('http');
        
                let protocol = https
        
                if (url[0] === '/') {
                    url = 'http://localhost:3000' + url //todo set as env var
                    protocol = http
                }
                
                const options = {
                    headers: {
                        accept: 'application/json',
                        // Authorization: `Bearer ${apiGetToken}`
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
            })
        },
        req: {
            injectVars: (req, serverRendered=false) => {
                return `
                    if (typeof(window.${globalDataName}) === 'undefined') { window.${globalDataName} = {} } 
                    window.${globalDataName}.routePattern = '${req.route.path}'
                    window.${globalDataName}.params = ${JSON.stringify(req.params)}`
            }
        }
    }
}


Sk8erMike.http = Sk8erMike.serverSide ? serverInterface.http : clientInterface.http
Sk8erMike.req = Sk8erMike.serverSide ? serverInterface.req : clientInterface.req