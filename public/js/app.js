import { Sk8erMike, state } from './sk8ermike/index.js'
import { allowedModels, routes } from './app-config.js'
import { LayoutMain, Breadcrumb, Head, Home, ModelIndex, ModelDetail } from './component/index.js'
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
    new LayoutMain()
    new Head('Home for my Dome')
    new Breadcrumb('Home for my Dome', null, Breadcrumb.view.home)
    new Home(allowedModels)
})

app.get(routes.modelIndex, async (req) => {
    const model = req.params.model

    new LayoutMain()
    new Head(model)
    new Breadcrumb(model, model, Breadcrumb.view.modelIndex)
    new ModelIndex(model)
})

app.get(routes.modelDetails, async (req) => {
    const model = req.params.model
    const id = req.params.id
    
    new LayoutMain()
    const component = await new ModelDetail(model, id)
    const title = component.getTitle()
    new Head(title)
    new Breadcrumb(title, model, Breadcrumb.view.modelDetail)
})

app.ready()

export { app }