const _ = require('./lodash/core.js')

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
            //State changed trigger callback subscriptions
            if (_.has(State.instance.subs, path)) { //TODO: trigger all callbacks in path heirachry. If path is test.foo, call subs.test.foo() and subs.test()
                _.get(State.instance.subs, path).forEach(callback => {
                    callback(value, previousValue, path)
                })
            }
            //Update the state
            if (hasValue) {
                _.set(State.instance.state, path, value)
            } else {
                State.instance.state = value
            }
        }
    }

    get(path='') {
        if (path !== '') {
            return _.get(State.instance.state, path, obj)
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

module.exports = {
    state: () => State.instance
}