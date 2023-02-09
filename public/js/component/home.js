import { Component }  from '../sk8ermike/index.js'
import { site } from '../template/index.js'

export default class Home extends Component {
    constructor(allowedModels) {
        super(arguments)
        
        this.rootNode('#main-content')

        this.onRender(() => {
            return site.home({models: allowedModels})
        })

        this.render()
    }
}