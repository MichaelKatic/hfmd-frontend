import { Element, elementProxy, $A, $Body, $Div, $H, $H1, $H2, $H3, $H4, $H5, $H6, $Head, $Hr, $Iframe, $Img, $Input, $Label, $Li, $Link, $P, $Pre, $Script, $Style, $Table, $Td, $Title, $Tr } from '../smalle/e.js'
import { Sk8erMike } from '../sk8ermike/index.js'

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
        if (this.attributes.href !== undefined) {
            let href = this.getFullUrl(this.attributes.href)
            let hasLocalLink = href !== undefined && this.attributes.target !== '_blank'
            let isCurrentUrl = href === Sk8erMike.global.document.location.href

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
                // if href is a url targeted at this tab, use optimized local app routing
                const randomString = () => Math.random().toString(36).replace('0.', '');
                const uniqueClass = 'anchor_' + randomString();
                this.attributes.class = (this.attributes.class || '') + ' ' + uniqueClass
                this.attributes.href = 'javascript:;'
                this.attributes.onclick = window.sk8ermikeApp.visitWithPreload(href, uniqueClass)
                // TODO add server side visit with preload like global.hfmd.app.visitWithPreload(href, uniqueClass)
                // It will have to inject something into the headder to trigger preload after site loads.  
            }
        }

        return super.render()
    }
}

//TODO make smalle base variables a global singleton that can be easilly overwritten instead of this hodgepodge.

const $newP = elementProxy(Paragraph)
const $newA = elementProxy(Anchor)

export {
    Element,
    $newA as $A,
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
    $newP as $P,
    $Pre,
    $Script,
    $Style,
    $Table,
    $Td,
    $Title,
    $Tr,
}