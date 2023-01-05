var _ = require('lodash')

class State {
    static instance = null;
    state = {}
    subs = {} //Things like {"prop.color.green": [callback1, callback2]}

    constructor()  {
        if (State.instance === null) {
            const proxyHandler = {
                get(target, property) {
                    //Normal behavior if property found
                    if (property in target) {
                        return target[property]
                    }
                    
                    //Otherwise get from state
                    // Reflect.get(target, property)
                    return target.state[property]
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

            State.instance = new Proxy(this, proxyHandler);
        }

        return State.instance
    }

    set(path, value, clobber=false) {
        const hasValue = path !== '';

        // const pathEmpty = hasValue ? !_.has(path) : Object.keys(obj).length === 0;
        // if (!clobber && !pathEmpty)
        // {
        //     console.warn('Warning, cannot overwite state without setting clobber to true')
        // }

        const previousValue =  _.get(this.state, path)
        if (previousValue !== value) {
            //State changed trigger callback subscriptions
            if (path in this.subs) { //TODO: trigger all callbacks in path heirachry. If path is test.foo, call subs.test.foo() and subs.test()
                this.subs[property].forEach(callback => {
                    callback(value, previousValue, path)
                })
            }
            //Update the state
            if (hasValue) {
                _.set(this.state, path, value)
            } else {
                this.state = value
            }
        }
    }

    get(path='') {
        if (path !== '') {
            return _.get(this.state, path, obj)
        } else {
            return this.state
        }
    }

    sub(path, callback) {
        let callbacks = _.get(this.subs, path) || []
        callbacks.push(callback)
        _.set(this.subs, path, callbacks)

        //If value exists call callback immediatly
        const value = _.get(this.state, path)
        if (value !== undefined)
        {
            callback(value, '', path)
        }
    }
}

module.exports = {
    state: new State()
}