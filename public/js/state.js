// const _ = require('./lodash/core.js')

class State {
    static get instance() { 
        if (window.stateinstance === undefined)
        {
            window.stateinstance = new State()
        }
        return window.stateinstance 
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

    set(path, value, clobber=false) {
        const hasValue = path !== '';

        // const pathEmpty = hasValue ? !_.has(path) : Object.keys(obj).length === 0;
        // if (!clobber && !pathEmpty)
        // {
        //     console.warn('Warning, cannot overwite state without setting clobber to true')
        // }

        const previousValue =  _.get(State.instance.state, path)
        if (previousValue !== value) {
            //Update the state
            if (hasValue) {
                _.set(State.instance.state, path, value)
            } else {
                State.instance.state = value
            }

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

    get(path='') {
        if (path !== '') {
            return _.get(State.instance.state, path)
        } else {
            return State.instance.state
        }
    }

    sub(path, callback) {
        let callbacks = _.get(State.instance.subs, path) || []
        callbacks.push(callback)
        _.set(State.instance.subs, path, callbacks)

        //If value exists call callback immediatly
        const value = _.get(State.instance.state, path)
        if (value !== undefined)
        {
            callback(value, '', path)
        }
    }
}

export function state() { return State.instance }