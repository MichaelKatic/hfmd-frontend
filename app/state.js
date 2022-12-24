var _ = require('lodash')

class State {
    static instance = null;
    state = {}

    constructor()  {
        if (State.instance === null) {
            const proxyHandler = {
                get(target, property)
                {
                    if (!(property in target)) {
                        return target.state[property]
                    }
    
                    return target[property];
                }
            }

            State.instance = new Proxy(this, proxyHandler);
        }

        return State.instance
    }

    set(path, obj, clobber=false) {
        const pathSet = path !== '';
        const pathEmpty = pathSet ? !_.has(path) : Object.keys(obj).length === 0;

        if (!clobber && !pathEmpty)
        {
            console.warn('Warning, cannot overwite state without setting clobber to true')
        }

        if (pathSet) {
            _.set(this.state, path, obj)
        } else {
            this.state = obj
        }
    }

    get(path='') {
        if (path == '') {
            return this.state
        } else {
            return _.get(this.state, path, obj)
        }
    }
}

module.exports = {
    state: new State()
}