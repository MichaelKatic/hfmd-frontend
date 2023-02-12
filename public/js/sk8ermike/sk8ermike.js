import { Component } from './index.js'

const globalName = 'sk8ermike'
const globalDataName = 'sk8ermikeData'
const globalAppName = 'sk8ermikeApp'

 //👄✌️🕶👟📐☄️🪐🐉🌵🌊🛹🪩🛴🫠🤙🪹🪺🥚🍳🐣🐥🐤🐓🍗🦴
export default class Sk8erMike {
    
    static get globalName() { return typeof window !== 'undefined' ? 'window' : 'global' }
    static get global() { return typeof window !== 'undefined' ? window : global }
    static get clientSide() { return typeof window !== 'undefined' }
    static get serverSide() { return typeof global !== 'undefined' }
    static get instance() { return Sk8erMike.global[globalName] } 
    static set instance(value) { Sk8erMike.global[globalName] = value }

    static expressProxyApp = {}

    constructor() {
        if (!this.instance) {
            this.instance = this
        }

        return this.instance;
    }

    static globalCustomSetup(route, req, res) {}

    static globalSetup(customSetup, stateToLocals) {
        Sk8erMike.globalCustomSetup = customSetup
        // Component.globalStateToLocals = stateToLocals

        if (Sk8erMike.clientSide) {
            const globalSk8erMikeSetup = () => {
                const setIsMobile = (userAgent) => {
                    let isMobile = false; 
                    if (!!userAgent) {
                        isMobile = !!userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)
                    }
                    state.set('isMobile', isMobile)
                }
                setIsMobile(window.navigator.userAgent)

                if (!('isMobile' in Component.globalStateToLocals)) {
                    Component.globalStateToLocals['isMobile'] = 'isMobile'
                }
            }

            globalSk8erMikeSetup()
            Sk8erMike.globalCustomSetup()
        }
    }

    static config(configuration, express, jsdom) {
        let app = Sk8erMike.app
        const isServerConfig = express !== undefined
        if (isServerConfig) {
            const expressApp = express()

            const routes = configuration.routes

            for (const route of Object.values(routes)) {
                expressApp.get('/params' + route, function (req, res) {
                    res.json({
                        routePattern: route,
                        params: req.params
                    })
                })
            }

            const serverDomSetup = (href) => {
                const dom = new jsdom.JSDOM(`<!DOCTYPE html>`)
                const document = dom.window.document
                document.location.href = href 
                const DOMParser = dom.window.DOMParser
                Sk8erMike.global.document = document
                Sk8erMike.global.DOMParser = DOMParser
            }

            const globalSk8erMikeSetup = (route, req, res) => {
                const setIsMobile = (userAgent) => {
                    let isMobile = false; 
                    if (!!userAgent) {
                        isMobile = !!userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)
                    }
                    state.set('isMobile', isMobile)
                }
                setIsMobile(req.get('user-agent'))

                if (!('isMobile' in Component.globalStateToLocals)) {
                    Component.globalStateToLocals['isMobile'] = 'isMobile'
                }
            }
            
            const routeLookup = Object.keys(routes).reduce((acc, key) => {
                const value = routes[key]
                acc[value] = key
                return acc
            }, {})
            
            const exspressProxyHandler = {
                get(target, prop, receiver) {
                    if (prop === 'get') {
                        const getWrapper = function() {
                            if (arguments.length < 2) {
                                return target[prop](...arguments) 
                            }
                            const route = arguments[0]
                            const callback = arguments[1]
                            const autoResolve = arguments[2] !== undefined ? arguments[2] : true
                            if (routeLookup[route] !== undefined) {
                                const wrappedCallback = async function (req, res) {
                                    
                                    serverDomSetup('http://localhost/' + req.url)
                                    globalSk8erMikeSetup(route, req, res)
                                    Sk8erMike.globalCustomSetup(route, req, res)

                                    req.Sk8erMike = { preload: false }

                                    const callbackResult = await callback(req, res)

                                    if (autoResolve) {
                                        Component.addRenderingCompleteCallback(()=>{
                                            Sk8erMike.req.injectVars(req)
                                            res.send(document.documentElement.innerHTML)
                                        })
                                    }

                                    return callbackResult
                                }
                                return target[prop](route, wrappedCallback)
                            } else {
                                return target[prop](...arguments)
                            }
                        }
                        return getWrapper
                    }
                    return target[prop]
                },
            };
            app = new Proxy(expressApp, exspressProxyHandler);
            app.expressApp = expressApp;
        }
        return app
    }
}

let clientInterface = {}
let serverInterface = {}

if (Sk8erMike.clientSide) {
    if (window.history) { //TODO Don't know if this code is doing anything
        var previousUrl = window.location.href
        window.addEventListener('hashchange', function(){
            window.history.pushState({}, null, previousUrl)
        })
    }
    
    window.addEventListener('popstate', (event) => { 
        const url = document.location
        const eventState = event.state
        app.visit(url, false)
    })
    
    const clientError = (error) => {
        console.warn('%c☄️ error!', 'padding: 5px; background:#ff85cc; color:#000000', error)
    }

    const app = {
        appRouteCallbacks: {},
        triggerCallback: (callback, params, preload=false) => {
            const req = {
                params: params,
                Sk8erMike: { preload: preload }
            }
            new Promise(async resolve => {
                const previousPreload = Component.preload
                Component.preload = preload //This might not be threadsafe. If things blow up weirdly, look here :D
                await callback(req)
                Component.addRenderingCompleteCallback(() => app.ready())
                Component.preload = previousPreload
                resolve()
            })
        },
        get: (pattern, callback) => {
            if (Sk8erMike.req.routePattern === pattern) {
                app.triggerCallback(callback, Sk8erMike.req.params)
            }
            app.appRouteCallbacks[pattern] = callback
        },
        visit: (url, pushState=true) => {
            const {origin, pathname, hash} = new URL(url)
            const isInternalUrl = origin === document.location.origin
            if (isInternalUrl) {
                //Override browser behavior
                try {
                    if(pushState) {
                        window.history.pushState('History Item Name', 'New Page Title', url)
                    }
                    const paramsUrl = origin + '/params' + pathname + hash
                    const response = Sk8erMike.http.get(paramsUrl)
                    const callback = app.appRouteCallbacks[response.routePattern]
                    app.triggerCallback(callback, response.params)

                    console.log('%c🛴 Fast naving!', 'padding: 5px; background:#cc85ff; color:#000000', pathname)
                } catch (error) {
                    clientError(error)
                    window.history.back()
                    return
                }
            } else {
                //Do normal load
                window.location.href = url
            }
        },
        preloadQueue: [],
        isReady: false,
        ready: () => {
            if (!app.isReady) {
                app.isReady = true
                console.log('%c🤙 app running!', 'padding: 5px; background:#85ffcc; color:#000000')
                for (const preload of Sk8erMike.app.preloadQueue)
                {
                    preload()
                }
            }
        },
        preload: (url, uniqueClass = '') => {
            const {origin, pathname} = new URL(url)
            const isInternalUrl = origin === document.location.origin
            if (isInternalUrl) {
                const paramsUrl = origin + '/params' + pathname
                const response = Sk8erMike.http.get(paramsUrl)
                const callback = app.appRouteCallbacks[response.routePattern]
                app.triggerCallback(callback, response.params, true)
                const element = document.querySelector('.' + uniqueClass)
                console.log('%c🦴 Link preload: ' + pathname, 'padding: 5px; background:#85d2ff; color:#000000', {element})
            }
        },
        visitWithPreload: (url, uniqueClass) => {
            setTimeout(() => {
                if (app.isReady) {
                    app.preload(url, uniqueClass)
                } else {
                    app.preloadQueue.push(() => app.preload(url, uniqueClass))
                }
            }, 0) 
            
            return `${Sk8erMike.globalName}.${globalAppName}.visit('${url}')`
        }
    }

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
            params: window[globalDataName].params,
            injectVars: () => {} //Should never do anything. 
        },
        app
    }
}
            
if (Sk8erMike.serverSide) {
    const serverError = (error, res) => {
        console.warn('☄️ ' + error + ' ' + res.statusCode + ' ' + res.statusMessage) 
    }

    const app = { 
        appRouteCallbacks: {},
        routes: (exspresProxyApp) => {
            for (const route in app.appRouteCallbacks) {
                const callback = app.appRouteCallbacks[route]
                exspresProxyApp.get(route, callback)
            }
        },
        get: (pattern, callback) => {
            if (Sk8erMike.req.routePattern === pattern) {
                const req = {
                    params: Sk8erMike.req.params,
                    Sk8erMike: { preload: false }
                }
                callback(req)
            }
            app.appRouteCallbacks[pattern] = callback
        },
        ready: () => {}, // Do nothing server side.
        visitWithPreload: (href, uniqueClass) => {} // Do nothing. We'll wait for the client to re-render this page.
        // TODO add server side visit with preload like global.hfmd.app.visitWithPreload(href, uniqueClass)
        // It will have to inject something into the headder to trigger preload after site loads.  
        // Then stop the client from doing the redundent render.
    }

    serverInterface = {
        http: {
            get: () => { }, // No non-promise version of get server-side. 
            getPromise: (url) => new Promise(async (resolve, reject) => {
                const https = await import('https');
                const http = await import('http');
        
                let protocol = https
        
                if (url[0] === '/') {
                    url = 'http://localhost:3000' + url
                }

                if (url.startsWith('http://localhost')) {
                    protocol = http
                }
                
                const options = {
                    headers: {
                        accept: 'application/json',
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
                            let parsedData
                            try {
                                parsedData = JSON.parse(rawData);
                            } catch(error) {
                                parsedData = rawData
                            }

                            if (res.statusCode >= 200 && res.statusCode < 300) {
                                resolve(parsedData)
                            } else {
                                serverError(parsedData, res)
                                reject(parsedData)
                            }
                        } catch(error) {
                            reject(error)
                        }
                    });
                }).on('error', (error) => {
                    reject(error)
                });
            })
        },
        req: {
            injectVars: (req) => {
                const injectionScriptId = 'sk8erMikeScript'
                const alreadyInjected = document.head.querySelector(`#${injectionScriptId}`) !== null
                if (!alreadyInjected) {
                    const headerElements = `
                        <script id="${injectionScriptId}" type="application/javascript">
                            if (typeof(window.${globalDataName}) === 'undefined') { window.${globalDataName} = {} };
                            window.${globalDataName}.routePattern = '${req.route.path}';
                            window.${globalDataName}.params = ${JSON.stringify(req.params)};
                        </script>`

                    const newHeaderElements = new DOMParser().parseFromString(headerElements.replace(/\s\s+/g, ' '), "text/html").head.childNodes
                    for (const element of newHeaderElements) {
                        document.head.appendChild(element)
                    }
                }
            }
        },
        app
    }
}

Sk8erMike.http = Sk8erMike.serverSide ? serverInterface.http : clientInterface.http
Sk8erMike.req = Sk8erMike.serverSide ? serverInterface.req : clientInterface.req
Sk8erMike.app = Sk8erMike.serverSide ? serverInterface.app : clientInterface.app

Sk8erMike.global[globalAppName] = Sk8erMike.app