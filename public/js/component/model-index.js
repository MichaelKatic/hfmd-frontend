import { Sk8erMike, Component }  from '../sk8ermike/index.js'
import { site } from '../template/index.js'

export default class ModelIndex extends Component {
    constructor(modelName) {
        super(arguments)

        const fields = encodeURIComponent(['id','Title'].join(', '))
        const requestPath = `/data/${modelName}?fields=${fields}`
        const statePath = `cms.api.${modelName}.index`

        this.rootNode('body')

        this.promiseToState(
            () => Sk8erMike.http.getPromise(requestPath),
            response => response.data,
            statePath
        )

        this.stateToLocals({
            isMobile: 'isMobile',
            activeStyle: 'activeStyle',
            index: statePath
        })
        
        this.onRender(({index}) => {
            const titleHtml = site.title({title: modelName})
            const modelIndexHtml = site.modelIndex({model: modelName, data: index})
            const wrappedBodyHtml = site.wrapperBody({content: titleHtml + modelIndexHtml})

            return wrappedBodyHtml
        })
    }
}

// const component = new Component()

// component.rootNode('body')

// let initialized = false
// component.init = (modelName) => {   
//     if (!initialized) {
//         initialized = true
//         const fields = encodeURIComponent(['id','Title'].join(', '))
//         const requestPath = `/data/${modelName}?fields=${fields}`
//         const statePath = `cms.api.${modelName}.index`

//         component.promiseToState(
//             () => sk8ermike.getPromise(requestPath),
//             response => response.data,
//             statePath
//         )

//         component.stateToLocals({
//             isMobile: 'isMobile',
//             activeStyle: 'activeStyle',
//             index: statePath
//         })
        
//         component.onRender(({index}) => {
//             const titleHtml = site.title({title: modelName})
//             const modelIndexHtml = site.modelIndex({model: modelName, data: index})
//             const wrappedBodyHtml = site.wrapperBody({content: titleHtml + modelIndexHtml})

//             return wrappedBodyHtml
//         })
//     }
// }

// export default component