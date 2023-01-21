// const _ = require('../lodash/core.js')

import '../lodash/core.js'

// import _ from "lodash"

let globalSpace = typeof(window) !== 'undefined' ? window : global

class State {
    static #look = '👀' // Use varaible that is super likely to be unused. If this is causing you a bug I have no sympathy. 
    static look(stateProxyItem) {
        return stateProxyItem[State.#look]()
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
                    let result = JSON.parse(JSON.stringify(target[property]))
                    if (/*target.hasOwnProperty(property) &&*/ property !== State.#look) {
                        const newPath = path + (path === '' ? '' : '.') + property
                        if (result instanceof Object) {
                            result = getProxy(result, newPath)
                        } else {
                            result = {}
                        }
                        result[State.#look] = () => ({ // Could make this a proxy. Store path of state in proxy for lookup.
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
        const previousValue =  _.get(State.instance.state, path)
        if (previousValue !== value) {
            // Update the state
            console.log('%c🍗 State updated: ' + path, 'padding: 5px; background:#85ccff; color:#000000')
            console.log('\tfrom: ', previousValue)
            console.log('\tto: ', value)
            _.set(State.instance.state, path, value)

            if (trigger) {
                // State changed trigger callback subscriptions
                const pathArray = path.split(/(?=[\.,[])/g) // convert 'cms.api[9].blogs.2' to ['cms', '.api', '[9]', '.blogs', '.2']
                while (pathArray.length > 0) { // Find all callbacks in path heirarchy
                    const subPath = pathArray.join('')
                    pathArray.pop()
                    if (_.has(State.instance.subs, subPath)) {
                        const pathValue = _.get(State.instance.subs, subPath)
                        if (Array.isArray(pathValue)) {
                            pathValue.forEach(callback => {
                                if (typeof(callback) === 'function') {
                                    const valueInState = _.get(State.instance.state, subPath)
                                    const relativePath = path.substring(subPath.length + 1)
                                    let previousValueInState;
                                    if (typeof previousValue !== 'object') {
                                        previousValueInState = previousValue
                                    }else if (relativePath == '') { 
                                        previousValueInState = JSON.parse(JSON.stringify(previousValue))
                                    } else {
                                        previousValueInState = JSON.parse(JSON.stringify(valueInState))
                                        _.set(previousValueInState, relativePath, previousValue)
                                    }
                                    callback(valueInState, previousValueInState, path, relativePath)
                                }
                            })
                        }
                    }
                }
            }
        }
    }

    get(path) {
        return _.get(State.instance.state, path)
    }

    getSub(path) { 
        return _.get(State.instance.subs, path) || []
    }

    sub(path, callback, trigger) {
        let callbacks = _.get(State.instance.subs, path) || []
        if (!callbacks.includes(callback)) {
            callbacks.push(callback)
            _.set(State.instance.subs, path, callbacks)

            if (trigger && isPopulated([path])) {
                //If value exists call callback immediatly
                const value = _.get(State.instance.state, path)
                callback(value, value, path, '')
            }
        }
    }

    trigger(path) {
        const callbacks = _.get(State.instance.subs, path)
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
            _.set(State.instance.state, path, null) // Set state without trigginging subscriptions
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
