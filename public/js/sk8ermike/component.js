import state, { State, useState, isPopulated } from './state.js'

const isServer = typeof global !== 'undefined' && typeof window === 'undefined'

class View {
    #name = ''
    #enabled = false;
    #preloaded = false;
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
        this.#stateToLocalsMap = stateToLocalsMap
        this.#localsToStateMap = {}
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
            this.preload()
            useState(this.#stateToLocalsMap, this.onStateChanged) // subscribe to state changes. This triggers the html to render and preload links on the page. So we don't want to do this until we're on the page.
            // this.#stateWatcher = useState(this.#stateToLocalsMap, this.onStateChanged) // subscribe to state changes
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
            this.#html = render(locals)
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
    descriptor = 'Component'
    preloadOnly = false;
    getRootNode() { return typeof document !== 'undefined' ? document.querySelector(this.rootNodeSelector) : undefined }
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

    constructor(baseArguments, disableLookup=false) {
        let extendedComponent = this.constructor.name !== Component.name

        if (baseArguments !== undefined && !disableLookup) {
            // If called with arguments return existing componet with same arguments. 
            const key = JSON.stringify({
                constructor: this.constructor.name,
                arguments: baseArguments
            })
            const existingComponent = Component.componentDictionarty[key]
            if (existingComponent !== undefined) {
                return existingComponent
            } else {
                Component.componentDictionarty[key] = this
            }
        }

        this.descriptor = this.constructor.name + (extendedComponent ? ` (${Component.name}})` : '')

        return this
    }

    rootNode(rootNodeSelector) {
        this.rootNodeSelector = rootNodeSelector
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
        if (!this.preloadOnly) {
            const view = this.getView(viewName)
            view.enable()
            view.htmlPromise().then((html) => {
                const rootNode = this.getRootNode()
                rootNode.outerHTML = html

                // When replacing body an extra head is added so we have to remove it. 
                // https://stackoverflow.com/questions/52888347/setting-document-body-outerhtml-creates-empty-heads-why
                if (rootNode.tagName === 'BODY') {
                    const emptyHead = document.querySelector('head:empty')
                    if (emptyHead) {
                        emptyHead.remove()
                    }
                }
            })
        }
        return this
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