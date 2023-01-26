# Sk8erMike JS

## Extended Component

$$component/model-details-component.js$$
```
import { Component }  from '../sk8ermike/index.js'
import { site, editorJs } from '../template/index.js'

export default class ModelDetail extends Component {
    constructor () {
        super(...arguments) //TODO review returning same instance when same params
        
        const statePath = `cms.api.${modelName}.${id}`
        const requestPath = `/data/${modelName}/${id}`

        component.rootNode('body')
        
        this.promiseToState(
            () => sk8ermike.getPromise(requestPath),
            response => response.data,
            statePath
        )

        this.stateToLocals({
            isMobile: 'isMobile', // TODO: could have definable vars to wait for incluide (isMobile, activeStyle) these for all compoentnes
            activeStyle: 'activeStyle',
            id: statePath + '.id',
            attributes: statePath + '.attributes'
        })
        
        this.onRender(({id, attributes}) => {
            const titleHtml = site.breadcrumb({
                id: id,
                title: attributes.Title,
                model: modelName
            })
            const editorJsBody = attributes.Body
            const bodyHtml = renderEditorJs(editorJsBody.blocks)
            const wrappedBodyHtml = site.wrapperBody({content: titleHtml + bodyHtml})

            return wrappedBodyHtml
        })
    }

    getTitle = (id) => {
        return this.locals(id).attributes.Title
    }
}
```

$$client-app.js$$
```
app.get(routes.modelDetails, (params, preload=false) => {   
    const component = new ModelDetail(modelName, id)
    component.preload()
    if (!preload) {
        component.render()
    }
}
```


## Generic Component

$$component/model-details.js$$
```
import { Component }  from '../sk8ermike/index.js'
import { site, editorJs } from '../template/index.js'

const component = new Component()

component.rootNode('body')

component.init = (modelName, id) => {
    const statePath = `cms.api.${modelName}.${id}`
    const requestPath = `/data/${modelName}/${id}`

    component.promiseToState(
        () => sk8ermike.getPromise(requestPath),
        response => response.data,
        statePath, 
        id
    )

    component.stateToLocals({
        isMobile: 'isMobile', 
        activeStyle: 'activeStyle',
        id: statePath + '.id',
        attributes: statePath + '.attributes'
    }, id)
    
    component.onRender(({id, attributes}) => {
        const titleHtml = site.breadcrumb({
            id: id,
            title: attributes.Title,
            model: modelName
        })
        const editorJsBody = attributes.Body
        const bodyHtml = renderEditorJs(editorJsBody.blocks)
        const wrappedBodyHtml = site.wrapperBody({content: titleHtml + bodyHtml})

        return wrappedBodyHtml
    }, id)
}
```

$$client-app.js$$
```
app.get(routes.modelDetails, (params, preload=false) => {   
    modelDetails.init(params.model, params.id)
    modelDetails.preload(id)
    if (!preload) {
        modelDetails.render(id)
    }
}
```