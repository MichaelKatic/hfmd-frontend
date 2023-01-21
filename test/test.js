import assert from 'assert';
import * as e from '../public/js/smalle/element.js'

const { 
    Element, $A, $Body, $Div, $H, $H1, $H2, $H3, $H4, $H5, $H6, $Head, $Hr, $Iframe, $Img, $Input, $Label, $Li, $Link, $P, $Pre, $Script, $Style, $Table, $Td, $Title, $Tr 
 } = e

describe('Smalle Library', () => {

    describe('Element', () => {
        it('Should render elements with custom tags', () => {
            const customElement = new Element('customTag')
            assert.equal(customElement.render(), '<customTag></customTag>')
        })
    })
    
    describe('All $ properties', () => {
        for (const propertyName in e) {
            const property = e[propertyName]
            if (propertyName[0] === '$' && property.name === 'Element') {
                const tagName = propertyName.substring(1).toLowerCase()
                
                it(`Should render ${propertyName}`, () => {
                    assert.equal(property.render(), `<${tagName}></${tagName}>`)
                })
            }
        }
    })
    
    describe('$P', () => {
        it('Should render paragraph with attributes specified', () => {
            assert.equal($P.render(), '<p></p>')
            assert.equal($P('content').render(), '<p>content</p>')
            assert.equal($P.push('content').render(), '<p>content</p>')
            assert.equal($P.push('content').push('content').render(), '<p>contentcontent</p>')
            assert.equal($P.attribute('fake attribute').render(), '<p attribute="fake attribute"></p>')
            assert.equal($P('content').attribute('fake attribute').render(), '<p attribute="fake attribute">content</p>')
            assert.equal($P.bool('checked').render(), '<p checked></p>')
            assert.equal($P.checked().render(), '<p checked></p>')
        })
    })

    describe('Element heriarchy structure', () => {
        it('Should render elements and their children', () => {
            assert.equal($Body($Div($P)).render(), '<body><div><p></p></div></body>')
        })
        
        it('Should render elements and an array of children', () => {
            assert.equal($Body([$Div, $Div]).render(), '<body><div></div><div></div></body>')
            assert.equal($Body([$Div('first'), $Div('second')]).render(), '<body><div>first</div><div>second</div></body>')
        })

        it('Should pretty print elements formatted', () => {
            assert.equal($Body([$Div('first'), $Div('second')]).renderPretty(), '<body>\r\n\t<div>first</div>\r\n\t<div>second</div>\r\n</body>')
        })

        // it('Should return promise when element is a promise', () => {
        //     const elementPromise = new Promise((resolve, reject) => { 
        //         resolve($P)
        //     })

        //     $Body(elementPromise).render()
        //     assert.equal(, '<body>\r\n\t<div>first</div>\r\n\t<div>second</div>\r\n</body>')
        // })
    })

    
    // TODO Test:
    // - Heirarchy of elements
    // - Array of elements
    // - Pretty Print
    // - Elements with promises
    // - Static Element functions (html)
    // - Test custome elements
    //    - H, Link, etc
})