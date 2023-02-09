import { Sk8erMike, Component }  from '../../sk8ermike/index.js'
import { Element, $A, $Body, $Div, $H, $H1, $H2, $H3, $H4, $H5, $H6, $Head, $Hr, $Iframe, $Img, $Input, $Label, $Li, $Link, $P, $Pre, $Script, $Style, $Table, $Td, $Title, $Tr } from '../../smalle-extended/e.js';
import { site } from '../../template/index.js'

export default class LayoutMain extends Component {
    constructor() {
        super(arguments)

        const breadcrumbId = 'main-breadcrumb'
        const contentId = 'main-content'
        
        this.rootNode('body')

        this.onRender(() => {
            return $Body(
                $Div.style(state.activeStyle.wrapper).push([
                    $Div().id(breadcrumbId).class(),
                    $Div().id(contentId)
                ])
            )
        })

        this.render()
    }
}