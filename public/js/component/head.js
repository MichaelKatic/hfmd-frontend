import { Sk8erMike, Component }  from '../sk8ermike/index.js'
import { site } from '../template/index.js'

export default class Head extends Component {
    constructor(title, inject) {
        super(arguments)
        
        this.rootNode('head')

        this.onRender(() => {
            if (Sk8erMike.serverSide) {
                // Only render head server side
                const headHtml = site.htmlHead({title: title, inject: inject});
                return headHtml
            }
        })
    }
}