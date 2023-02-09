import { Component }  from '../sk8ermike/index.js'
import { Element, $A, $Body, $Div, $H, $H1, $H2, $H3, $H4, $H5, $H6, $Head, $Hr, $Iframe, $Img, $Input, $Label, $Li, $Link, $P, $Pre, $Script, $Style, $Table, $Td, $Title, $Tr } from '../smalle-extended/e.js';
import { site } from '../template/index.js'

export default class Breadcrumb extends Component {
    constructor(title, model='', view) {
        super(arguments)
        
        this.rootNode('#main-breadcrumb')

        this.onRender(() => {
            return $H1([site.logo(), ' ' + title]).style(state.activeStyle.title)
        }, Breadcrumb.view.home)

        this.onRender(() => {
            return $H1.style(state.activeStyle.h1).push(
                site.logo() + ' • ' + title 
            )
        }, Breadcrumb.view.modelIndex)

        this.onRender(() => {
            return $H1.style(state.activeStyle.h1).push([
                site.logo(),
                ' • ',
                $A.href('../' + model).target('_self').push(model),
                ' • ',
                title,
            ])
        }, Breadcrumb.view.modelDetail)

        this.render(view)
    }

    static view = {
        home: 'home',
        modelIndex: 'modelIndex',
        modelDetail: 'modelDetail'
    }
}