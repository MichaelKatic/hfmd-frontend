import { Sk8erMike, Component }  from '../sk8ermike/index.js'
import { site } from '../template/index.js'

export default class ModelIndex extends Component {
    constructor(modelName) {
        super(arguments)

        const fields = encodeURIComponent(['id','Title'].join(', '))
        const requestPath = `/data/${modelName}?fields=${fields}`
        const statePath = `cms.api.${modelName}.index`

        this.rootNode('#main-content')

        this.promiseToState(
            () => Sk8erMike.http.getPromise(requestPath),
            response => response.data,
            statePath
        )

        this.stateToLocals({
            index: statePath
        })
        
        this.onRender(({index}) => {
            return site.modelIndex({model: modelName, data: index})
        })

        this.render()
    }
}