import { Sk8erMike, state } from './sk8ermike/index.js'
import { allowedModels, routes } from './app-config.js'
import style from './style.js'
import { Home, ModelIndex, ModelDetail } from './component/index.js'

const app = Sk8erMike.app

const setIsMobile = (userAgent) => {
    const isMobile = !!userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)
    state.set('isMobile', isMobile)
    state.set('activeStyle', isMobile ? style.mobileStyle : style.defaultStyle)
}

const setAllowedModels = (allowedModels) => {
    state.set('allowedModels', allowedModels)
}

setIsMobile(window.navigator.userAgent)
setAllowedModels(allowedModels)

app.get(routes.root, (_, preload=false) => {
    new Home()
        .preload(preload)
        .render()
})

app.get(routes.modelIndex, (params, preload=false) => {
    const modelName = params.model
    new ModelIndex(modelName)
        .preload(preload)
        .render()
})

app.get(routes.modelDetails, (params, preload=false) => {    
    const modelName = params.model
    const id = params.id
    new ModelDetail(modelName, id)
        .preload(preload)
        .render()
})

app.ready()
