import { Element, $A, $Body, $Div, $H, $H1, $H2, $H3, $H4, $H5, $H6, $Head, $Hr, $Iframe, $Img, $Input, $Label, $Li, $Link, $P, $Pre, $Script, $Style, $Table, $Td, $Title, $Tr } from '../smalle-extended/e.js';
import state from '../sk8ermike/state.js';

const htmlHead = ({title, inject=null}) => 
    $Head([
        $Title(title),
        $Style(`
            .intro::first-letter {
                ${state.activeStyle.firstLetter}
            }
        `),
        $Link.rel('stylesheet').type('text/css').href(`/css/style-${state.isMobile ? 'mobile' : 'desktop'}.css`).async(),
        $Link.rel('stylesheet').type('text/css').href('/css/style.css').async(),
        $Link.rel('stylesheet').href('https://use.typekit.net/whq2zsc.css').async(), //Adobe font styles
        $Link.rel('icon').type('image/png').href('/favicon/coffee-16.ico').async(),
        inject ? $Script(inject).type('application/javascript') : '',
        $Script.type('application/javascript').src(`/js/lodash/core.js`),
        $Script.type('module').src('/js/app.js'),
    ]).render()

const home = ({models}) => 
    $Div([
        $H1([logo(), ' Home for my Dome']).style(state.activeStyle.title),
        $H1(
            models.map(model => 
                $A(model).href('./' + model).target('_self')
            )
        ).style(state.activeStyle.h1),
        $Iframe.src('https://skatermike.playcode.io/').style({width: '100%', height: '500px'})
    ])

const wrapperBody = ({content}) => 
    $Body(
        $Div(content).style(state.activeStyle.wrapper)
    ).render()
    
const modelIndex = ({model, data}) => 
    data.map(item =>
        $H2.style(state.activeStyle.h2).push(
            $A.href('./' + model + '/' + item.id).target('_self').push(
                item.attributes.Title
            )
        ).render()
    ).join('')

const logo = () => 
    $A.href('/').target('_self').push(
        $Img.src('/images/stewart.png').style('image-rendering: pixelated; height: 1em;')
    ).render()

const breadcrumb = ({id='', model, title}) => 
    $H1.id(id).style(state.activeStyle.h1).push([
        logo(),
        ' • ',
        $A.href('../' + model).target('_self').push(model),
        ' • ',
        title,
    ]).render()

const title = ({id, title}) => 
    $H1.id(id ?? undefined).style(state.activeStyle.h1).push(
        logo() + ' • ' + title 
    ).render()

export default {
    htmlHead,
    home,
    wrapperBody,
    modelIndex,
    logo,
    breadcrumb,
    title
}