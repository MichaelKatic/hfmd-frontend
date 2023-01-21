//Alternative name to smalle "small e" is "no big e" nobiggy
class Element {
    //Maybe include attributes somwhere
    // https://www.w3schools.com/tags/ref_attributes.asp
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

        this.tag = tag;
        this.attributes = attributes;
        this.content = content

        const proxyHandler = {
            get(target, property) //tricky way of settting content instead of getting anything
            {
                if (!(property in target)) {
                    return function() {
                        let attributeValue = arguments[0] //Only allow one param. Ignore other for now. Could create attribute handler methods or sumpin
                        
                        if (property === 'style') {
                            if (typeof attributeValue === 'string') {
                                attributeValue = attributeValue.replace(/[\s\n]+/g, ' ') //Remove extra whitespace
                            } else if (typeof attributeValue === 'object') {
                                attributeValue = Object.keys(attributeValue).map(styleKey => 
                                    styleKey + ': ' + attributeValue[styleKey]
                                ).join('; ')
                            } 
                        } else if (typeof attributeValue === 'undefined') {
                            //Boolean attribute
                            attributeValue = 'undefined'
                        }

                        // target.attributes[property] = attributeValue
                        target.addAttribute(property, attributeValue)

                        return this
                        // target[ property ].apply( target, arguments ); //call original function
                    }
                }

                return target[property];
            },

            //SHITE, CANT HAVE APPLY ON CLASS :( Maybe convert to a function :( :(
            apply(target, thisArg, argumentsList) {
                console.log(target, thisArg, argumentsList)
                return thisArg.push(...argumentsList)
            }
            
            //Add array-like indexing
            // get(target, prop) {
            //     if (Number(prop) == prop && !(prop in target)) {
            //         return this.content[prop];
            //     }
            //     return target[prop];
            // }
        }

        // this.__proto__.call = () => {console.log('prototype call!')}
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

    addAttribute(name, value) {
        this.attributes[name] = value;
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
        return (Object.keys(this.attributes).map(key => {
            const attribute = this.attributes[key]

            if (key === 'checked')
            {
                return attribute ? key : ''
            }

            if (key === 'bool')
            {
                return attribute
            }

            if (attribute === 'undefined')
            {
                return key
            }

            if (attribute === undefined)
            {
                return ''
            }

            return `${key}=${JSON.stringify(attribute)}`
        }).join(' '));
    }    

    renderContent(content) {
        content = content || this.content
        if (Array.isArray(content)) {
            return content.map(item => this.renderContent(item)).join('')
        } else if (content instanceof Element) {
            return content.render()
        } else if (content.prototype === Element.prototype) {
            return content.render()
        } else if (content.hasOwnProperty('prototype') && new content() instanceof Element) {
            return content.render()
        // } else if (content.hasOwnProperty('smalleValue')) {
        //     return content.smalleValue
        } else if (typeof content === 'function') {
            return content()
        } else {
            return content
        }
    }

    //BIG NOTE BOI - TODO
    // We can make all individual components subscribe to the parts of the state they use.
    // STEPS 
    // 1. make all state heirarchy proxies. 
    // 2. On render call, we can check content and all attributes. 
    // 3. Any that have proxy property 'sub' or whatever
    // 4. We create a subscription to call render again later.
    // Prereq: we'll also have to link render directly to dom element or sumpin.
        
    renderStart(tag = null) {
        return `<${(tag ?? this.tag + ' ' + this.renderAttributes()).trim()}>`
    }
    render() {
        return this.renderStart() + this.renderContent() + this.renderEnd()
    }
    renderEnd(tag = null) {
        return `</${tag ?? this.tag}>`
    }

    renderPretty() {
        var tab = '\t';
        var result = '';
        var indent= '';
    
        this.render().split(/>\s*</).forEach(function(element) {
            if (element.match( /^\/\w/ )) {
                indent = indent.substring(tab.length);
            }
    
            result += indent + '<' + element + '>\r\n';
    
            if (element.match( /^<?\w[^>]*[^\/]$/ ) && !element.startsWith("input")  ) { 
                indent += tab;              
            }
        });
    
        return result.substring(1, result.length-3);
    }

    html() {
        let templateString = this.render()
    	  return new DOMParser().parseFromString(templateString, 'text/html').body;
    }

    static html(templateString) {
        return new DOMParser().parseFromString(templateString, 'text/html').body;
    }
}
Element.prototype.call = () => {} //Enables proxy to capture calls to instances of this class. 

class Paragraph extends Element {
    constructor(...args) {
        return super('p', ...args)
    }

    //Extend funcitonality if you please. 
}

class Anchor extends Element {
    constructor(...args) {
        return super('a', ...args)
    }

    getFullUrl(href) {
        let url = {}

        try{
            url = new URL(href)
        } catch (error) {
            try{
                if (href[0] == '.') {
                    url = new URL(document.location.origin + '/' + href)
                } else if (href[0] == '/') {
                    url = new URL(document.location.origin + href)
                }
            } catch (error) {
                return undefined
            }   
        }

        return url.href
    }

    render() {
        let href = this.getFullUrl(this.attributes.href)
        let hasLocalLink = href !== undefined && this.attributes.target !== '_blank'
        const globalSpace = typeof(window) !== 'undefined' ? window : global
        let isCurrentUrl = href === globalSpace.document.location.href

        if (this.attributes.href[0] === '#') {
            let hash = this.attributes.href.replace("'", "")
            let url = document.location.href
            const hashIndex = url.indexOf('#')
            url = url.substring(0, hashIndex == -1 ? undefined : hashIndex) + hash
            this.attributes.href = 'javascript:;'
            this.attributes.onclick = `this.scrollIntoView(); window.history.pushState('Scroll', 'test title', '${url}');`
        } else if (isCurrentUrl) {
            this.attributes.href = '#'
        } else if (hasLocalLink) {
            // if href is a url targeted at this tab use optimized local app route
            const randomString = () => Math.random().toString(36).replace('0.', '');
            const uniqueClass = 'anchor_' + randomString();
            this.attributes.class = (this.attributes.class || '') + ' ' + uniqueClass
            this.attributes.href = 'javascript:;'
            this.attributes.onclick = globalSpace.hfmd.app.visitWithPreload(href, uniqueClass)
            // TODO add server side visit with preload like global.hfmd.app.visitWithPreload(href, uniqueClass)
            // It will have to inject something into the headder to trigger preload after site loads.  
        }

        return super.render()
    }
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

// const table = new Proxy(this, () => {
//     get(target, property) //tricky way of settting content instead of getting anything
//     {
//         // console.log(target, property)

//         if (!(property in target)) {
//             return function() {                
//                 target.attributes[property] = arguments[0]

//                 return this
//             }
//         }

//         return target[property];
//     }
// });

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
    $Body: 'body',
    $Div: 'div',
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
    $P: 'p',
    $Pre: 'pre',
    $Script: 'script',
    $Style: 'style',
    $Table: 'table',
    $Td: 'td',
    $Title: 'title',
    $Tr: 'tr',
}

//Defaults
let $A = elementProxy(Element, 'a')
let $Body = elementProxy(Element, 'body')
let $Div = elementProxy(Element, 'div')
let $H1 = elementProxy(Element, 'h1')
let $H2 = elementProxy(Element, 'h2')
let $H3 = elementProxy(Element, 'h3')
let $H4 = elementProxy(Element, 'h4')
let $H5 = elementProxy(Element, 'h5')
let $H6 = elementProxy(Element, 'h6')
let $Head = elementProxy(Element, 'head')
let $Hr = elementProxy(Element, 'hr')
let $Iframe = elementProxy(Element, 'iframe')
let $Img = elementProxy(Element, 'img')
let $Input = elementProxy(Element, 'input')
let $Label = elementProxy(Element, 'label')
let $Li = elementProxy(Element, 'li')
let $Link = elementProxy(Element, 'link')
let $P = elementProxy(Element, 'link')
let $Pre = elementProxy(Element, 'pre')
let $Script = elementProxy(Element, 'script')
let $Style = elementProxy(Element, 'style')
let $Table = elementProxy(Element, 'table')
let $Td = elementProxy(Element, 'td')
let $Title = elementProxy(Element, 'title')
let $Tr = elementProxy(Element, 'tr')

//Extended
let $H = elementProxy(H)
$P = elementProxy(Paragraph)
$A = elementProxy(Anchor)

// const exportModules = {Element}

// //Generates exports like "exportModules.$H1 = elementProxy(Element, 'h1')"
// Object.keys(defaultProxiesTags).forEach(name => {
//     const tag = defaultProxiesTags[name];
//     exportModules[name] = elementProxy(Element, tag)
// })

// //Override default proxies
// exportModules.$P = elementProxy(Paragraph) //Set your own extension of element
// exportModules.$H = elementProxy(H) //Set your own extension of element

// export exportModules

export {
    Element,
    $A,
    $Body,
    $Div,
    $H,
    $H1,
    $H2,
    $H3,
    $H4,
    $H5,
    $H6,
    $Head,
    $Hr,
    $Iframe,
    $Img,
    $Input,
    $Label,
    $Li,
    $Link,
    $P,
    $Pre,
    $Script,
    $Style,
    $Table,
    $Td,
    $Title,
    $Tr,
}

const globalSpace = (typeof(window) !== 'undefined' ? window : global)
if(globalSpace.e === undefined) {
    //Export global variable 'e' unless it's being used already
    globalSpace.e = {
        Element,
        $A,
        $Body,
        $Div,
        $H,
        $H1,
        $H2,
        $H3,
        $H4,
        $H5,
        $H6,
        $Head,
        $Hr,
        $Iframe,
        $Img,
        $Input,
        $Label,
        $Li,
        $Link,
        $P,
        $Pre,
        $Script,
        $Style,
        $Table,
        $Td,
        $Title,
        $Tr,
    }
} else {
    console.warn('Smalle not exported to gloabl e variable since its being used. Current value:', globalSpace.e)
}