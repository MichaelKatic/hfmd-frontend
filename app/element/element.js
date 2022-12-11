//Maybe include attributes somwhere
// https://www.w3schools.com/tags/ref_attributes.asp

class Element {
    #attributes = {}
    #content = []
    #tag = 'undefined'

    constructor(tag, params) {
        let attributes
        let content

        //tag, {attributes, content}
        if (typeof(params) != 'undefined')
        {
            attributes = params.attributes
            content = params.content
        }

        //tag, attributes, content
        if (typeof(attributes) === 'undefined' && typeof(content) === 'undefined')
        {
            attributes = arguments[1]
            content = arguments[2]
        }

        if (typeof(attributes) === 'undefined')
        {
            attributes = {}
        }

        if (typeof(content) === 'undefined')
        {
            content = []
        }

        //TO make this abstract
        // if(this.constructor === Element){
        //     throw new Error("You cannot create an instance of     Abstract Class");
        //     }
        // };

        this.tag = tag;
        this.attributes = attributes;
        this.content = content

        const proxyHandler = {
            // set(target, property, value) {

            // },
            get(target, property) //tricky way of settting content instead of getting anything
            {
                if (!(property in target)) {
                    return function() {
                        let value = arguments[0] //Only allow one param. Ignore other for now. Could create attribute handler methods or sumpin
                        
                        if (property === 'style')
                        {
                            value = value.replace(/[\s\n]+/g, ' ')
                        }

                        target.attributes[property] = value

                        return this
                        // target[ property ].apply( target, arguments ); //call original function
                    }
                }

                return target[property];
            }
            
            //Add array-like indexing
            // get(target, prop) {
            //     if (Number(prop) == prop && !(prop in target)) {
            //         return this.content[prop];
            //     }
            //     return target[prop];
            // }
        }

        return new Proxy(this, proxyHandler);
    }

    set content(content) {
        if (!Array.isArray(content))
        {
            content = [content];
        }

        this.#content = content
    }

    get content() {
        return this.#content
    }

    set attributes(attributes) {
        for (const key in attributes) {
            if (attributes.hasOwnProperty(key)) {
                let attribute = attributes[key];
                if (attribute !== undefined)
                {
                    if (key === 'style')
                    {
                        attribute = attribute.replace(/[\s\n]+/g, ' ')
                    }
                    this.attributes[key] = attribute
                }
            }
        }

        this.#attributes = attributes
    }

    get attributes() {
        return this.#attributes
    }

    push = (item) => { 
        if (Array.isArray(item)) {
            this.#content.push(...item)
        } else {
            this.#content.push(item)
        }
        return this;
    }

    #renderAttributes = () => Object.keys(this.attributes).map(key => {
        if (key === 'checked')
        {
            return this.attributes[key] ? key : ''
        }

        return `${key}=${JSON.stringify(this.attributes[key])}`
    }).join('')
    

    #renderContent = (content) => {
        content = content || this.content
        if (Array.isArray(content)) {
            return content.map(item => this.#renderContent(item)).join('')
        } else if (content instanceof Element) {
            return content.render()
        } else if (typeof content === 'function') {
            return content()
        } else {
            return content
        }
    }
        
    renderStart = () => `<${this.tag} ${this.#renderAttributes()}></$>`

    render = () => this.renderStart() + this.#renderContent() + this.renderEnd()

    renderEnd = () => `</${this.tag}>`
}

class Paragraph extends Element {
    constructor(...args) {
        // super(Element.types[typeof(this)], attributes, content)
        super('p', ...args)
    }

    static renderEnd = () => `</p>`
}

class Division extends Element {
    constructor(...args) {
        super('div', ...args)
    }

    static renderEnd = () => `</div>`
}

class Body extends Element {
    constructor(...args) {
        super('body', ...args)
    }

    static renderEnd = () => `</body>`
}

module.exports = {
    Element,
    Body,
    Division,
    Paragraph,
}
