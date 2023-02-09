import { Sk8erMike, Component }  from '../sk8ermike/index.js'
import { site } from '../template/index.js'

export default class Head extends Component {
    constructor(title) {
        super(arguments)
        
        this.rootNode('head')

        this.onRender(() => {
            if (Sk8erMike.serverSide) { //this is not needed but makes it faster. 
                // Only render head server side
                return site.htmlHead({title: title})
            }
        })

        this.render()
    }
}