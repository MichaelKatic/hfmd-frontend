import { Sk8erMike, state } from './sk8ermike/index.js'
import { allowedModels, routes } from './app-config.js'
import { Head, Home, ModelIndex, ModelDetail } from './component/index.js'
import style from './style.js'

const app = Sk8erMike.app

Sk8erMike.globalSetup(
    (route, req, res) => {
        state.set('activeStyle', state.get('isMobile') ? style.mobileStyle : style.defaultStyle)
        state.set('allowedModels', allowedModels)
    }, 
    {
        activeStyle: 'activeStyle',
        allowedModels: 'allowedModels' 
    }
)

app.get(routes.root, async (req) => {
    new Head('Home for my Dome', Sk8erMike.req.injectVars(req)).render()
    new Home(allowedModels).render()
})

app.get(routes.modelIndex, async (req) => {
    const modelName = req.params.model
    new Head(modelName, Sk8erMike.req.injectVars(req)).render()
    new ModelIndex(modelName).render()
})

app.get(routes.modelDetails, async (req) => {
    const model = req.params.model
    const id = req.params.id
    const [, component] = await new ModelDetail(model, id).render()
    new Head(component.getTitle(), Sk8erMike.req.injectVars(req)).render()
})

app.ready()

export { app }