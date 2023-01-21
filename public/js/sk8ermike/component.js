import state, { State, useState, isPopulated } from './state.js'

const isServer = typeof global !== 'undefined' && typeof window === 'undefined'

class View {
    #name = ''
    #enabled = false;
    #preloaded = false;
    #promisesToState = []
    #stateToLocalsMap = {} // localVar: 'some.state.path'
    #localsToStateMap = {} // 'some.state.path': 'localVar'
    #stateWatcher = {}
    #locals = {}
    #html = undefined

    get name() { return this.#name }
    get stateWatcher() { return this.#stateWatcher } //TODO don't know if this is needed.

    constructor(name) {
        this.#name = name
    }

    promiseToState(promise, then, path, overwrite = false, triggerSubs = true) {
        this.#promisesToState.push(() => {
            if (overwrite || !isPopulated([path])) {
                promise().then(
                    function () { 
                        state.set(path, then(...arguments), triggerSubs)
                     }
                ).catch(
                    error => console.warn('%c☄️ error!', 'padding: 5px; background:#ff85cc; color:#000000', error)
                )
            }
        })
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
            this.#promisesToState.forEach(promise => promise()) // Call all promises
        }
    }

    enable() {
        if (!this.#enabled) {
            this.#enabled = true
            this.preload()
            useState(this.#stateToLocalsMap, this.onStateChanged) // subscribe to state changes
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
            this.onRenderPromise(this.#html)
            this.onRenderPromise = () => {} // Stop this from potentially calling resolve multiple times.
        }
    }

    localsToHtml(locals) {
        console.warn('Warning: Unimplemented', this)
        return ''
    }

    html () { return this.#html }

    htmlPromise () {
        return new Promise(resolve => {
            if (this.#html !== undefined) {
                resolve(this.#html)
            } else {
                this.onRenderPromise = (html) => {
                    resolve(html)
                    // this.onRenderPromise(html)
                }
            }
        })
    }
}

export default class Component {

    // enabled = false;
    rootNodeSelector = undefined
    rootNode() { return typeof document !== 'undefined' ? document.querySelector(this.rootNodeSelector) : undefined }
    views = {}
    addView() {
        this.views[arguments[0]] = new View(...arguments)
    }
    getView(viewName) { 
        let view = this.views.default;
        if (viewName !== undefined) {
            view = this.views[viewName]
            if (view === undefined) {
                // Set view property if nonexistant
                view = this.addView(viewName)
            }
        }
        return view
    }

    constructor(rootNodeSelector) {
        this.rootNodeSelector = rootNodeSelector
        this.addView('default')
    }

    promiseToState(promise, then, path, viewName = undefined, overwrite = false, triggerSubs = true) {
        const view = this.getView(viewName)
        view.promiseToState(promise, then, path, overwrite, triggerSubs)
    }
    
    stateToLocals (stateToLocalsMap, viewName = undefined) {
        const view = this.getView(viewName)
        view.stateToLocals(stateToLocalsMap)
    }

    onRender(render, viewName = undefined) {
        const view = this.getView(viewName)
        view.onRender(render)
    }

    preload(viewName = undefined) {
        const view = this.getView(viewName)
        view.preload()
    }

    render(viewName = undefined) {
        const view = this.getView(viewName)
        view.enable()
        view.htmlPromise().then((html) => {
            const rootNode = this.rootNode()
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

    html(viewName = undefined) {
        const view = this.getView(viewName)
        view.enable()
        return view.html()
    }

    htmlPromise(viewName = undefined) {
        const view = this.getView(viewName)
        view.enable()
        return view.htmlPromise()
    }
}