import { Component }  from '../sk8ermike/index.js'
import { site } from '../template/index.js'

export default class Home extends Component {
    constructor() {
        super(arguments)
        
        this.rootNode('body')

        this.stateToLocals({
            allowedModels: 'allowedModels',
            isMobile: 'isMobile',
            activeStyle: 'activeStyle'
        })

        this.onRender(({allowedModels}) => {
            const titleHtml = site.home({models: allowedModels})
            const wrappedBodyHtml = site.wrapperBody({content: titleHtml})
            return wrappedBodyHtml
        })
    }
}