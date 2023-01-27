import { Component }  from '../sk8ermike/index.js'
import { site } from '../template/index.js'

export default class Home extends Component {
    constructor(allowedModels) {
        super(arguments)
        
        this.rootNode('body')

        this.stateToLocals({
            isMobile: 'isMobile',
            activeStyle: 'activeStyle'
        })

        this.onRender(() => {
            const titleHtml = site.home({models: allowedModels})
            const wrappedBodyHtml = site.wrapperBody({content: titleHtml})
            return wrappedBodyHtml
        })
    }
}