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
    const preload = req.Sk8erMike.preload
    new Head('Home for my Dome', Sk8erMike.req.injectVars(req)).preload(preload).render()
    new Home(allowedModels).preload(preload).render()
})

app.get(routes.modelIndex, async (req) => {
    const modelName = req.params.model
    const preload = req.Sk8erMike.preload
    new Head(modelName, Sk8erMike.req.injectVars(req)).preload(preload).render()
    new ModelIndex(modelName).preload(preload).render()
})

app.get(routes.modelDetails, async (req) => {    
    const model = req.params.model
    const id = req.params.id
    const preload = req.Sk8erMike.preload
    const [, component] = await new ModelDetail(model, id).preload(preload).render()
    new Head(component.getTitle(), Sk8erMike.req.injectVars(req)).preload(preload).render()
})

app.ready()
