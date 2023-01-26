// const _ = require('../lodash/core.js')

import '../lodash/core.js'

// import _ from "lodash"

let globalSpace = typeof(window) !== 'undefined' ? window : global

const copy = value => {
    if (typeof value === 'object') {
        return JSON.parse(JSON.stringify(value))
    } else {
        return value
    }
}

class State {
    static #look = '👀' // Use varaible that is super likely to be unused. If this is causing you a bug I have no sympathy. 
    static look(lookObject) {
        return (lookObject[State.#look] || (()=>undefined))()
    }
    static setLook(lookObject, lookValue) {
        lookObject[State.#look] = () => lookValue
    }
    static get instance() {
        if (globalSpace.state === undefined)
        {
            globalSpace.state = new State()
        }

        return globalSpace.state 
    }
    state = {}

    // TODO: State thoughts. Make it a proxy that on access checks it's child properties and replaces them with proxies. 
    // proxy would allow values to be passed by reference adding a "smalleValue" property or something ;) 
    setupStateProxy() {
        const getProxy = (stateProperty, path = '') => {
            return new Proxy(stateProperty, {
                get(target, property) { 
                    let result = copy(target[property])
                    if (/*target.hasOwnProperty(property) &&*/ property !== State.#look) {
                        const newPath = path + (path === '' ? '' : '.') + property
                        if (result instanceof Object) {
                            result = getProxy(result, newPath)
                        } else {
                            result = {}
                        }
                        State.setLook(result, { // Could make this a proxy. Store path of state in proxy for lookup.
                            value: result,
                            path: newPath
                        })
                    }

                    return result
                },
                // set(target, property, value) {
                //     target[property][valueName] = value
                // }
            })
        }

        this.stateProxy = getProxy(this.state)

        // const a = {
        //     b1: "b1",
        //     b1_2: (test, whatever) => { test = 10; newvar = 80 },
        //     b2: "b2",
        //     b3: {
        //         c1: 1,
        //         c2: 2,
        //         c3: [1, 2, 3, {four: 4}, 5, 6],
        //         c4: 'fore'
        //     }
        // };

        //TODO get proxy using undefind path like State.instance.stateProxy.fake.path.that.is.long

        // let aProxy = getProxy(a)

        // console.log(aProxy)
        // console.log(aProxy.b1)
        // console.log(aProxy.b1.smalleValue)
        // console.log(aProxy.b3)
        // console.log(aProxy.b3.c3[1])
        // console.log(aProxy.b3.c3[3])
        // console.log(aProxy.b3.c3[3].four)
    }

    subs = {} // Things like {"prop.color.green": [callback1, callback2]}

    constructor()  {
        this.setupStateProxy()

        const proxyHandler = {
            get(target, property) {                
                // Normal behavior if property found
                if (property in target) {
                    return target[property]
                }
                
                //Otherwise get from state
                // Reflect.get(target, property)
                // return target.state[property]
                return target.get(property)
            },
            set(target, property, value, receiver) {
                //Normal behavior if property found
                if (property in target) {
                    return Reflect.set(target, property, value, receiver)
                }
                //Otherwise call set method in state class.
                target.set(property, value)
            }
        }

        return new Proxy(this, proxyHandler)
    }

    set(path, value, trigger=true) { // Disable triggerSubs for things like preloading.
        const previousValue =  copy(_.get(State.instance.state, path))
        if (previousValue !== value) {
            // Update the state
            console.log('%c🍗 State updated: ' + path, 'padding: 5px; background:#85ccff; color:#000000')
            console.log('\tfrom: ', previousValue)
            console.log('\tto: ', value)
            _.setWith(State.instance.state, path, value, Object)

            if (trigger) {
                // State changed trigger callback subscriptions

                // Trigger callbacks up the tree
                const pathArray = path.split(/(?=[\.,[])/g) // convert 'cms.api[9].blogs.2' to ['cms', '.api', '[9]', '.blogs', '.2']
                while (pathArray.length > 0) { // Find all callbacks in path heirarchy
                    const upPath = pathArray.join('')
                    pathArray.pop()
                    if (_.has(State.instance.subs, upPath)) {
                        for(const callback of this.getSubs(upPath)) {
                        // const subCallbacks = this.getSubs(subPath)
                        // if (Array.isArray(subCallbacks)) {
                        //     subCallbacks.forEach(callback => {
                                // if (typeof(callback) === 'function') {
                                    const valueInState = copy(_.get(State.instance.state, upPath))
                                    const relativePath = path.substring(upPath.length + 1)
                                    let previousValueInState
                                    if (relativePath === '') {
                                        previousValueInState = previousValue
                                    } else {
                                        previousValueInState = copy(valueInState)
                                        _.setWith(previousValueInState, relativePath, copy(previousValue), Object)
                                    }
                                    callback(valueInState, previousValueInState, path, relativePath)
                                // }
                            // })
                        // }
                        }
                    }
                }

                // Trigger callbacks down the tree
                const getPaths = (someObject, path = '') => {
                    let paths = []
                    if (typeof someObject === 'object') {
                        for (const prop in someObject) { 
                            if (prop !== State.#look) {
                                const propPath = path === '' ? prop : path + '.' + prop
                                paths.push(propPath)
                                paths = paths.concat(getPaths(someObject[prop], propPath))
                            }
                        }
                    }
                    return paths
                }

                const subObject = _.get(State.instance.subs, path)
                for (const relativeDownPath of getPaths(subObject)) {
                    const fullDownPath = path + (path !== '' ? '.' : '') + relativeDownPath
                    for(const callback of this.getSubs(fullDownPath)) {
                        const valueInState = _.get(State.instance.state, fullDownPath)
                        const previousValueInState = _.get(previousValue, relativeDownPath)
                        callback(valueInState, previousValueInState, fullDownPath, '')
                    }
                }
            }
        }
    }

    get(path) {
        return _.get(State.instance.state, path)
    }

    getSubs(path) {  
        let subsCallbacks = []
        if (_.has(State.instance.subs, path)) {
            const subLookObject = _.get(State.instance.subs, path)
            subsCallbacks = State.look(subLookObject) || []
        }
        return subsCallbacks
    }

    sub(path, callback, trigger) {
        const subLookObject = _.get(State.instance.subs, path) || {}
        const subCallbackList = State.look(subLookObject) || []
        if (!subCallbackList.includes(callback)) {
            subCallbackList.push(callback)
            State.setLook(subLookObject, subCallbackList) 
            _.setWith(State.instance.subs, path, subLookObject, Object)

            if (trigger && isPopulated([path])) {
                //If value exists call callback immediatly
                const value = _.get(State.instance.state, path)
                callback(value, value, path, '')
            }
        }
    }

    trigger(path) {
        const callbacks = getSubs(path)
        const value = _.get(State.instance.state, path)

        if (callbacks !== undefined) {
            for (const callback of callbacks) {
                callback(value, value, '', '')
            }
        }
    }
}

export default State.instance

export const useState = (paths, onChange = ()=>{}, triggerSub = true) => {
    const response = {} //add on change
    for (const property in paths) {
        const path = paths[property]
        if (!_.has(State.instance.state, path)) {
            _.setWith(State.instance.state, path, null, Object) // Set state without trigginging subscriptions
        }
        response[property] = _.get(State.instance.stateProxy, path)
        State.instance.sub(path, onChange, triggerSub)
    }
    return response
}

export const isPopulated = (paths) => {
    return paths.reduce((prev, curr) => {
        const value = State.instance.get(curr)
        return prev && value !== undefined && value !== null
    }, true)
}

export { State }
