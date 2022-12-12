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
            },
            apply(target, thisArg, argumentsList) {
                console.log(target, thisArg, argumentsList)
                return target.push(...argumentsList)
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

    push(item) { 
        if (Array.isArray(item)) {
            this.content.push(...item)
        } else {
            this.content.push(item)
        }
        return this;
    }

    renderAttributes() { 
        return Object.keys(this.attributes).map(key => {
            const attribute = this.attributes[key]

            if (key === 'checked')
            {
                return attribute ? key : ''
            }

            if (attribute === undefined)
            {
                return ''
            }

            return `${key}=${JSON.stringify(attribute)}`
        }).join(' ')
    }    

    renderContent(content) {
        content = content || this.content
        if (Array.isArray(content)) {
            return content.map(item => this.renderContent(item)).join('')
        } else if (content instanceof Element) {
            return content.render()
        } else if (typeof content === 'function') {
            return content()
        } else {
            return content
        }
    }
        
    renderStart(tag = null) {
        return `<${tag ?? this.tag} ${this.renderAttributes()}>`
    }
    render() {
        return this.renderStart() + this.renderContent() + this.renderEnd()
    }
    renderEnd(tag = null) {
        return `</${tag ?? this.tag}>`
    }
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

class H extends Element {
    #levelTag = ''
    #level = 1

    constructor(...args) {
        return super('h', ...args)
    }

    level = (level) => {
        this.#level = level
        this.#levelTag = 'h' + this.#level
        return this
    }

    renderStart() { 
        return super.renderStart(this.#levelTag) 
    }

    renderEnd() { 
        return super.renderEnd(this.#levelTag) 
    }
}

const table = new Proxy(this, () => {
    get(target, property) //tricky way of settting content instead of getting anything
    {
        console.log(target, property)

        if (!(property in target)) {
            return function() {                
                target.attributes[property] = arguments[0]

                return this
            }
        }

        return target[property];
    }
});

const elementClassProxy = (tag) => { 
    return {
        get(target, property, receiver) {
            if (!(property in target)) { // access of non-existent static property
                return function() {
                    if (tag) {
                        return new target(tag)[property](...arguments)
                    } else {
                        return new target()[property](...arguments)
                    }
                    
                }
            }

            return target[property];
        },
        apply(target, thisArg, argumentsList) {
            console.log(target, thisArg, argumentsList)
            if (tag) {
                return new target(tag).push(...argumentsList)
            } else {
                return new target().push(...argumentsList)
            }
        }
    }
}

const elementProxy = (elementClass, tag = undefined) => new Proxy(elementClass, elementClassProxy(tag))

const defaultProxiesTags = {
    $A: 'a',
    $Body: 'div',
    $Division: 'div',
    $H1: 'h1',
    $H2: 'h2',
    $H3: 'h3',
    $H4: 'h4',
    $H5: 'h5',
    $H6: 'h6',
    $Head: 'head',
    $Hr: 'hr',
    $Iframe: 'iframe',
    $Img: 'img',
    $Input: 'input',
    $Label: 'label',
    $Li: 'li',
    $Link: 'link',
    $Paragraph: 'p',
    $Pre: 'pre',
    $Style: 'style',
    $Table: 'table',
    $Td: 'td',
    $Title: 'title',
    $Tr: 'tr',
}

exportModules = {Element}

//Generates exports like "exportModules.H1 = elementProxy(Element, 'h1')"
Object.keys(defaultProxiesTags).forEach(name => {
    const tag = defaultProxiesTags[name];
    exportModules[name] = elementProxy(Element, tag)
})

//Override default proxies
exportModules.$Paragraph = elementProxy(Paragraph) //Set your own extension of element
exportModules.$H = elementProxy(H) //Set your own extension of element

module.exports = exportModules
