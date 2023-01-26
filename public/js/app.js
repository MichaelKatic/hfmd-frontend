import { state, Sk8erMike } from './sk8ermike/index.js'
import style from './style.js'
import { allowedModels, routes } from './app-config.js'
import { Home, ModelIndex, ModelDetail } from './component/index.js'

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

const app = {
    appRouteCallbacks: {},
    get: (pattern, callback) => { 
        if (Sk8erMike.req.routePattern === pattern) {
            callback(Sk8erMike.req.params)
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
                app.appRouteCallbacks[response.routePattern](response.params)
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
            for (const preload of app.preloadQueue)
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
            app.appRouteCallbacks[response.routePattern](response.params, true)
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
        
        return `window.sk8ermikeApp.visit('${url}')`
    }
}

window.sk8ermikeApp = app

const clientError = (error) => {
    console.warn('%c☄️ error!', 'padding: 5px; background:#ff85cc; color:#000000', error)
}

const setIsMobile = (userAgent) => {
    const isMobile = !!userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)
    state.set('isMobile', isMobile)
    state.set('activeStyle', isMobile ? style.mobileStyle : style.defaultStyle)
}

const setAllowedModels = (allowedModels) => {
    state.set('allowedModels', allowedModels)
}

const runApp = () => {
    setIsMobile(window.navigator.userAgent)
    setAllowedModels(allowedModels)

    app.get(routes.root, (_, preload=false) => {
        new Home()
            .preload(preload)
            .render()
    })

    app.get(routes.modelIndex, (params, preload=false) => {
        const modelName = params.model
        new ModelIndex(modelName)
            .preload(preload)
            .render()
    })

    app.get(routes.modelDetails, (params, preload=false) => {    
        const modelName = params.model
        const id = params.id
        new ModelDetail(modelName, id)
            .preload(preload)
            .render()
    })
    
    app.ready() //👄✌️🕶👟📐☄️🪐🐉🌵🌊🛹🪩🛴🫠🤙🪹🪺🥚🍳🐣🐥🐤🐓🍗🦴
    console.log('%c🤙 app running!', 'padding: 5px; background:#85ffcc; color:#000000')
}

export const run = runApp()