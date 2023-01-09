import hfmd from './hfmd.js'
import template from './template/index.js'
import state from './state.js'
import { Element, $P } from './smalle/element.js'
import style from './style.js'
import {allowedModels, routes} from './app-config.js'

const setIsMobile = (userAgent) => {
    const isMobile = !!userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)
    state.set('isMobile', isMobile)
    state.set('activeStyle', isMobile ? style.mobileStyle : style.defaultStyle)
}

const templateDefault = ({id, type, data}) => 
    $P.push(`id: ${id} type: ${type} data: ${JSON.stringify(data)}`).render();

const mapTemplate = ({id, type, data}) => {    
    const imageSize = {
        large: 'large',
        small: 'small',
        medium: 'medium',
        thumbnail: 'thumbnail'
    }
    const size = imageSize.large;
    switch(type) {
        case 'paragraph': return template.editorJs.paragraph({id, type, data})
        case 'header': return template.editorJs.header({id, type, data})
        case 'image': {
            switch(data.file.formats != null && data.file.formats[size] != null) {
                case true: return template.editorJs.imageFormat(size)({id, type, data})
                case false: return template.editorJs.image({id, type, data})
            }
        }
        case 'list': {
            switch(data.style) {
                case 'unordered': return template.editorJs.listUnordered({id, type, data})
                case 'ordered': return template.editorJs.listOrdered({id, type, data})
            }
        }
        case 'embed': return template.editorJs.embed({id, type, data})
        case 'delimiter': return template.editorJs.delimiter({id, type, data})
        case 'table': return template.editorJs.table({id, type, data})
        case 'code': return template.editorJs.code({id, type, data}) 
        case 'raw': return template.editorJs.raw({id, type, data}) 
        case 'LinkTool': return template.editorJs.link({id, type, data}) 
        case 'checklist': return template.editorJs.checklist({id, type, data}) 
    }
    
    return templateDefault({id, type, data})
}

const renderEditorJs = (blocks) => {
    const firstParagraphIndex = blocks.findIndex(block => block.type === "paragraph")
    blocks[firstParagraphIndex].data.into = true;
    return blocks.reduce((acc, cur) => 
        acc + mapTemplate(cur)
    , '');
}

if (window.history) {
    var myOldUrl = window.location.href;
    window.addEventListener('hashchange', function(){
        window.history.pushState({}, null, myOldUrl);
    });
}

const appRouteCallbacks = {}

window.addEventListener('popstate', (event) => { 
    const url = document.location
    const eventState = event.state
    app.visit(url, false)
});

const app = {
    get: (pattern, callback) => { 
        const routePattern = window.hfmd.routePattern
        if (routePattern === pattern) {
            callback(window.hfmd.params)
        }
        appRouteCallbacks[pattern] = callback
    },
    visit: (url, pushState=true) => {
        const {origin, pathname} = new URL(url)
        const isInternalUrl = origin === document.location.origin;
        if (isInternalUrl) {
            //Override browser behavior
            if(pushState) {
                window.history.pushState('History Item Name', 'New Page Title', url);
            }
            const paramsUrl = origin + '/params' + pathname
            const response = hfmd.get(paramsUrl)
            appRouteCallbacks[response.routePattern](response.params)
        } else {
            //Do normal load
            window.location.href = url
        }
    },
    preloadQueue: [],
    isReady: false,
    ready: () => {
        if (!app.isReady) {
            app.isReady = true;
            for (const preload of app.preloadQueue)
            {
                preload()
            }
        }
    },
    preload: (url) => {
        const {origin, pathname} = new URL(url)
        const isInternalUrl = origin === document.location.origin;
        if (isInternalUrl) {
            const paramsUrl = origin + '/params' + pathname
            const response = hfmd.get(paramsUrl)
            appRouteCallbacks[response.routePattern](response.params, true)
        }
    },
    visitWithPreload: (url) => {
        setTimeout(() => {
            if (app.isReady) {
                app.preload(url)
            } else {
                app.preloadQueue.push(() => app.preload(url))
            }
        }, 0)
        
        return `window.hfmd.app.visit('${url}')`
    }
}

window.hfmd.app = app

const clientError = (error) => {
    console.log('error', error)
}

const runApp = () => {
    setIsMobile(window.navigator.userAgent);

    app.get(routes.root, (_, preload=false) => {
        if (!preload) {
            const titleHtml = template.site.home({models: allowedModels})
            const wrappedBodyHtml = template.site.wrapperBody({content: titleHtml})

            document.body = Element.html(wrappedBodyHtml)
        }
    })

    app.get(routes.modelIndex, (params, preload=false) => {
        const model = params.model
        const fields = encodeURIComponent(['id','Title'].join(', '))
        const statePath = `cms.api.${model}.index`
        const requestPath = `/data/${model}?fields=${fields}`

        const loadStateData = (trigger) => {
            if (!state.get(statePath)) {
                hfmd.getPromise(requestPath).then(
                    response => state.set(statePath, response.data, trigger),
                    error => clientError(error)
                )
            }
        }

        const subscribe = (trigger) => {
            if (state.getSub(statePath).length == 0) {
                state.sub(statePath, (value, previousValue, path, relativePath) => {
                    const headHtml = template.site.htmlHead({title: model});
                    const titleHtml = template.site.title({title: model})
                    const modelIndexHtml = template.site.modelIndex({model, data: value})
                    const wrappedBodyHtml = template.site.wrapperBody({content: titleHtml + modelIndexHtml})
            
                    document.body = Element.html(headHtml + wrappedBodyHtml)
                }, trigger)
            }
        }

        if (preload) {
            loadStateData(false)
            subscribe(false)
        } else if (!state.get(statePath)) {
            loadStateData(true)
            subscribe(true)
        } else {
            state.trigger(statePath)
        }
    })

    app.get(routes.modelDetails, (params, preload=false) => {
        const model = params.model
        const id = params.id
        const statePath = `cms.api.${model}.${id}`
        const requestPath = `/data/${model}/${id}`

        const loadStateData = (trigger) => {
            if (!state.get(statePath)) {
                hfmd.getPromise(requestPath).then(
                    response => state.set(statePath, response.data, trigger),
                    error => clientError(error)
                )
            }
        }

        const subscribe = (trigger) => {
            if (state.getSub(statePath).length == 0) {
                state.sub(statePath, (value, previousValue, path, relativePath) => {
                    const titleHtml = template.site.breadcrumb({
                        id: value.id,
                        title: value.attributes.Title,
                        model
                    })
                    const editorJsBody = value.attributes.Body
                    const bodyHtml = renderEditorJs(editorJsBody.blocks)
                    const wrappedBodyHtml = template.site.wrapperBody({content: titleHtml + bodyHtml})
            
                    document.body = Element.html(wrappedBodyHtml)
                }, trigger)
            }
        }
    
        if (preload) {
            loadStateData(false)
            subscribe(false)
        } else if (!state.get(statePath)) {
            loadStateData(true)
            subscribe(true)
        } else {
            state.trigger(statePath)
        }
    })

    app.ready(); 
    console.log('app running!')
}

export const run = runApp()