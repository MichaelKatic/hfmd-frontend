// const _ = require('./lodash/core.js')

class State {
    static get instance() {
        let globalSpace; 

        if (typeof(window) === 'undefined') {
            //node environment
            globalSpace = global;
        } else {
            //browser environment
            globalSpace = window;
        }

        if (globalSpace.state === undefined)
        {
            globalSpace.state = new State()
        }
        return globalSpace.state 
    }

    state = {}
    subs = {} //Things like {"prop.color.green": [callback1, callback2]}

    constructor()  {
        const proxyHandler = {
            get(target, property) {                
                //Normal behavior if property found
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

        return new Proxy(this, proxyHandler);
    }

    set(path, value, trigger=true) { //Disable triggerSubs for things like preloading.
        const hasValue = path !== '';
        const previousValue =  _.get(State.instance.state, path)
        if (previousValue !== value) {
            //Update the state
            if (hasValue) {
                _.set(State.instance.state, path, value)
            } else {
                State.instance.state = value
            }

            if (trigger) {
                //State changed trigger callback subscriptions
                const pathArray = path.split(/(?=[\.,[])/g) // convert 'cms.api[9].blogs.2' to ['cms', '.api', '[9]', '.blogs', '.2']
                while (pathArray.length > 0) { //Find all callbacks in path heirarchy
                    const subPath = pathArray.join('')
                    pathArray.pop()
                    if (_.has(State.instance.subs, subPath)) {
                        const pathValue = _.get(State.instance.subs, subPath)
                        if (Array.isArray(pathValue)) {
                            pathValue.forEach(callback => {
                                if (typeof(callback) === 'function') {
                                    const valueInState = _.get(State.instance.state, subPath)
                                    const relativePath = path.substring(subPath.length + 1)
                                    const previousValueInState = JSON.parse(JSON.stringify(valueInState));
                                    _.set(previousValueInState, relativePath, previousValue)
                                    // callback(value, previousValue, path) //previous value broken
                                    callback(valueInState, previousValueInState, path, relativePath)
                                }
                            })
                        }
                    }
                }
            }
        }
    }

    get(path='') {
        if (path !== '') {
            return _.get(State.instance.state, path)
        } else {
            return State.instance.state
        }
    }

    getSub(path) { 
        return _.get(State.instance.subs, path) || []
    }

    sub(path, callback, trigger) {
        let callbacks = _.get(State.instance.subs, path) || []
        if (!callbacks.includes(callback)) {
            callbacks.push(callback)
            _.set(State.instance.subs, path, callbacks)

            if (trigger) {
                //If value exists call callback immediatly
                const value = _.get(State.instance.state, path)
                if (value !== undefined) {
                    callback(value, value, '', '')
                }
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