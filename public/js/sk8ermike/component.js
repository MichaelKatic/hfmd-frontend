import state, { State, useState, isPopulated } from './state.js'

const isServer = typeof global !== 'undefined' && typeof window === 'undefined'

const copy = value => {
    if (typeof value === 'object') {
        return JSON.parse(JSON.stringify(value))
    } else {
        return value
    }
}

class View {
    #name = ''
    #enabled = false
    #preloaded = false
    #promiseToState = ()=>{}
    #stateToLocalsMap = {} // localVar: 'some.state.path'
    #localsToStateMap = {} // 'some.state.path': 'localVar'
    #stateWatcher = {}
    #locals = {}
    #html = undefined

    get name() { return this.#name }
    get stateWatcher() { return this.#stateWatcher } //TODO don't know if this is needed.
    get locals() { return this.#locals }

    constructor(name) {
        this.#name = name
        this.stateToLocals({})
    }

    promiseToState(promise, then, path, overwrite = false, triggerSubs = true) {
        this.#promiseToState = () => {
            if (overwrite || !isPopulated([path])) {
                promise().then(
                    function () { 
                        const promiseResult = then(...arguments)
                        state.set(path, promiseResult, triggerSubs) //TODO if promise returns error, then will fail. Catch and do something else.
                        console.log(`%c🌵 Promise Resolved`, 'padding: 5px; background:#ef85ff; color:#000000', { promiseResult })
                     }
                ).catch(
                    error => console.warn('%c☄️ error!', 'padding: 5px; background:#ff85cc; color:#000000', error)
                )
            }
        }
    }

    stateToLocals(stateToLocalsMap) {
        this.#stateToLocalsMap = copy(Component.globalStateToLocals)
        this.#localsToStateMap = {}
        Object.entries(stateToLocalsMap).forEach(([key, value]) => {
            this.#stateToLocalsMap[key] = value
        })
        Object.entries(this.#stateToLocalsMap).forEach(([key, value]) => {
            this.#localsToStateMap[value] = key
        })
    }

    preload() {
        if (!this.#preloaded) {
            this.#preloaded = true
            this.#promiseToState()
        }
    }

    enable() {
        if (!this.#enabled) {
            this.#enabled = true

            if (Object.keys(this.#stateToLocalsMap).length === 0) { // No locals associated with this component. Just render it. 
                this.localsToHtml(this.#locals)
            } else {
                this.preload()
                useState(this.#stateToLocalsMap, this.onStateChanged) // subscribe to state changes. This triggers the html to render and preload links on the page. So we don't want to do this until we're on the page.
            }
            // this.#stateWatcher = useState(this.#stateToLocalsMap, this.onStateChanged) // Another way to subscribe to state changes
        }
    }

    disable() {
        // TODO 
            // set enabled false
            // clear promises
            // remove state subscriptions
    }

    getLocals() {
        const componentState = {}
        for (const property in this.stateWatcher) {
            // componentState[property] = State.look(this.stateWatcher[property]).value
            componentState[property] = state.get(State.look(this.stateWatcher[property]).path)
        }
        return componentState;
    }

    localsReady() {
        const missingValues = Object.keys(this.#stateToLocalsMap).find(localName => this.#locals[localName] === undefined)
        return !missingValues
    }

    onStateChanged = (valueInState, previousValueInState, path, relativePath) => { //Arrow function def stops this from being set incorrectly on subscription callback 
        const localName = this.#localsToStateMap[path]
        this.#locals[localName] = valueInState

        // if (this.#enabled) {
            if (this.localsReady()) {
                console.log(`%c🌵 Locals ready`, 'padding: 5px; background:#ef85ff; color:#000000', { view: this })
                this.localsToHtml(this.#locals)
            }
        // }
    }

    localsReadyOnce() {
        const locals = this.getLocals()
        const missingValues = Object.values(this.#stateToLocalsMap).find(localName => locals[localName] === undefined)
        return !missingValues
    }

    onStateChangedOnce = () => { //Arrow function def stops this from being set incorrectly on subscription callback 
        // if (this.#enabled) {
            if (this.localsReadyOnce()) {
                this.localsToHtml(this.getLocals())
            }
        // }
    }

    onRenderPromise() {}
    onRender(render) {
        this.localsToHtml = (locals) => {
            let html = render(locals)
            if (typeof html === 'object' && 'render' in html && typeof html.render === 'function')
            {
                //returned a smalle element or something else that needs rendering.
                html = html.render()
            }
            this.#html = html
            
            console.log(`%c🌵 HTML Rendered`, 'padding: 5px; background:#ef85ff; color:#000000', { view: this })
            this.onRenderPromise(this.#html)
            this.onRenderPromise = () => {} // Stop this from potentially calling resolve multiple times.
        }
    }

    localsToHtml(locals) {
        console.warn('Warning: Unimplemented', this)
        return ''
    }

    html () { return this.#html }

    htmlPromise (addedReturn) {
        return new Promise(resolve => {
            if (this.#html !== undefined) {
                resolve([this.#html, addedReturn])
            } else {
                this.onRenderPromise = (html) => {
                    resolve([html, addedReturn])
                    // this.onRenderPromise(html) // TODO think I need this but it's creating an infinite loop
                }
            }
        })
    }
}

export default class Component {
    // enabled = false;
    rootNodeSelector = undefined
    replaceOuterHTML = true
    preserverRootId = true
    preserveRootClasses = true
    preserverRootAttribute = false
    descriptor = 'Component'
    preloadOnly = false;
    getRootNode() { 
        let result = undefined

        if (typeof document !== 'undefined') {
            result = document.querySelector(this.rootNodeSelector)

            if (result === null) {
                error => console.warn('%c☄️ error!', 'padding: 5px; background:#ff85cc; color:#000000', error)
                console.warn(
                    `%c🪐 Unable to find element using document.querySelector("${this.rootNodeSelector}")`,
                    'padding: 5px; background:#ff85cc; color:#000000',
                    document)
            }
        }

        return result
    }
    views = {}
    addView() {
        const newView = new View(...arguments)
        this.views[arguments[0]] = newView
        return newView
    }
    getView(viewName) { 
        viewName = viewName || 'default'
        let view = this.views[viewName]
        if (view === undefined) {
            // Set view property if nonexistant
            view = this.addView(viewName)
        }
        return view
    }

    static componentDictionarty = {}
    static rendering = 0
    static renderingCompleteCallbacks = []
    static addRenderingCompleteCallback(callback) {
        if (Component.rendering === 0) {
            callback()
        } else { 
            Component.renderingCompleteCallbacks.push(callback)
        }
    }
    static triggerRenderingCompleteCallback() {
        for (const callback of Component.renderingCompleteCallbacks) {
            callback()
        }
        Component.renderingCompleteCallbacks = [];
    }
    static globalStateToLocals = {}
    static preload = false;

    constructor(baseArguments, disableLookup=false) {
        let extendedComponent = this.constructor.name !== Component.name

        let result = this
        let newComponent = true

        if (baseArguments !== undefined && !disableLookup) {
            // If called with arguments return existing componet with same arguments. 
            const key = JSON.stringify({
                constructor: this.constructor.name,
                arguments: baseArguments
            })
            const existingComponent = Component.componentDictionarty[key]
            if (existingComponent !== undefined) {
                result = existingComponent
                newComponent = false
            } else {
                Component.componentDictionarty[key] = this
            }
        }

        if (newComponent)
        {
            this.descriptor = this.constructor.name + (extendedComponent ? ` (${Component.name})` : '')
        }

        result.preloadOnly = Component.preload

        return result
    }

    replaceTypes = {
        innerHTML: 'innerHTML',
        outerHTML: 'outerHTML'
    }

    rootNode(rootNodeSelector, replaceType = this.replaceTypes.innerHTML) {
        this.rootNodeSelector = rootNodeSelector
        this.replaceType = replaceType
        return this
    }

    promiseToState(promise, then, path, viewName = undefined, overwrite = false, triggerSubs = true) {
        const view = this.getView(viewName)
        view.promiseToState(promise, then, path, overwrite, triggerSubs)
        return this
    }
    
    stateToLocals (stateToLocalsMap, viewName = undefined) {
        const view = this.getView(viewName)
        view.stateToLocals(stateToLocalsMap)
        return this
    }

    onRender(render, viewName = undefined) {
        const view = this.getView(viewName)
        view.onRender(render)
        return this
    }

    preload(preloadOnly, viewName = undefined) {
        this.preloadOnly = !!preloadOnly
        const view = this.getView(viewName)
        view.preload()
        return this
    }

    render(viewName = undefined) {
        Component.rendering++
        return new Promise(resolve => {
            const view = this.getView(viewName)
            //Check if state has changes since last render. hmmmm, that wont work. Need to know any time any child element could have changed. How do we know if it's even still displaying, doens't matter if the state hasn't changed. 
            if (this.preloadOnly) {
                view.preload()
                resolve([view.html, this])
            } else {
                view.enable()
                view.htmlPromise().then(([html,]) => {
                    const rootNode = this.getRootNode()
                    if (html !== undefined) {
                        if (rootNode.tagName === 'HEAD') { //rootNode.outerHTML = html with head will wipe out body. 
                            rootNode.innerHTML = new DOMParser().parseFromString(html, "text/html").head.innerHTML
                        } else if (rootNode.tagName === 'BODY') {
                            rootNode.outerHTML = html

                            // When replacing body an extra head is added so we have to remove it. 
                            // https://stackoverflow.com/questions/52888347/setting-document-body-outerhtml-creates-empty-heads-why
                            if (rootNode.tagName === 'BODY') {
                                const emptyHead = document.querySelector('head:empty')
                                if (emptyHead) {
                                    emptyHead.remove()
                                }
                            }
                        } else if (this.replaceType === this.replaceTypes.innerHTML) {
                            rootNode.innerHTML = html
                        } else {
                            // const retainRootPreserves = (newHtml) => {
                            //     const oldElement = this.getRootNode()
                            //     const newElement = new DOMParser().parseFromString(newHtml, "text/html").body.firstElementChild

                            //     if (this.preserverRootId) {
                            //         newElement.id = oldElement.id
                            //     }

                            //     if (this.preserveRootClasses) {
                            //         if (oldElement.className != '' || newElement.className != '')
                            //         {
                            //             newElement.className = oldElement.className
                            //         }
                            //     }

                            //     if (this.preserverRootAttribute) {
                            //         newElement.attributes = oldElement.attributes
                            //     }

                            //     return newElement.outerHTML
                            // }

                            // html = retainRootPreserves(html)

                            rootNode.outerHTML = html
                        }
                    }

                    resolve([html, this])
                })
            }
            
            Component.rendering--
            if (Component.rendering === 0) {
                Component.triggerRenderingCompleteCallback()
            }
        })
    }

    //Returns component only after rendering complete
    renderThenComponent(viewName = undefined) {
        return new Promise(async resolve => {
            const [, component] = await this.render(viewName)
            resolve(component)
        })
    }

    html(viewName = undefined) {
        const view = this.getView(viewName)
        view.enable()
        return view.html()
    }

    htmlPromise(viewName = undefined) {
        const view = this.getView(viewName)
        view.enable()
        return view.htmlPromise(this)
    }

    locals(viewName = undefined) {
        const view = this.getView(viewName)
        return view.locals
    }
}