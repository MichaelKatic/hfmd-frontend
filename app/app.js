//External libs
import express from 'express'
import path from 'path'

import '../public/js/lodash/core.js'
import hfmdCms from './hfmd-cms.js'
import template from './template/index.js'
import { Home, ModelIndex, ModelDetail } from '../public/js/component/index.js'
import state from '../public/js/sk8ermike/state.js'
import style from '../public/js/style.js'
import {allowedModels, routes} from '../public/js/app-config.js'
import Sk8erMike from '../public/js/sk8ermike/sk8ermike.js'

const app = express()
const port = 3000

app.use(express.static('public'))

// Cool image styling
// https://www.w3schools.com/css/css3_images.asp

// Responsive website layouts:
// https://www.w3schools.com/css/tryit.asp?filename=trycss3_flexbox_website2

// AMAZING FONT REFERENCE:
// https://xd.adobe.com/ideas/principles/web-design/best-modern-fonts-for-websites/

const serverError = (error, res) => {
    res.status(500).send(error.status + " " + error.message) //TODO user friendly errors
}

const serverDataError = (error, res) => {
    res.json({error: error})
}

app.get('/data/:model/:id', function (req, res) {
    const model = req.params.model
    const id = req.params.id

    if (!allowedModels.includes(model))
    {
        res.status(401).send("Unauthorized")
        return
    }

    hfmdCms.get(`https://cms.homeformydome.com/api/${model}/${id}`).then(
        response => {
            const parseEditorJsBody = (body) => {
                body.replace('\\\\"', '\"').replace('\\"', '\'')
                return JSON.parse(body)
            }
            response.data.attributes.Body = parseEditorJsBody(response.data.attributes.Body)
            res.json(response)
        },
        error => serverDataError(error, res)
    )
})

app.get('/data/:model/', function (req, res) {
    const model = req.params.model
    const fields = req.query.fields

    if (!allowedModels.includes(model))
    {
        res.status(401).send("Unauthorized")
        return
    }

    hfmdCms.get(`https://cms.homeformydome.com/api/${model}?fields=${fields}`).then(
        response => res.json(response),
        error => serverDataError(error, res)
    )
})

for (const route of Object.values(routes)) {
    app.get('/params' + route, function (req, res) {
        res.json({
            routePattern: route,
            params: req.params
        })
    })
}

const setIsMobile = (userAgent) => {
    const isMobile = !!userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)
    state.set('isMobile', isMobile)
    state.set('activeStyle', isMobile ? style.mobileStyle : style.defaultStyle)
}

const setAllowedModels = (allowedModels) => {
    state.set('allowedModels', allowedModels)
}

app.get(routes.root, (req, res) => {
    global.document = {location: {href: req.url}}
    global.hfmd = {app: {visitWithPreload: (href, uniqueClass) => {}}}
    setIsMobile(req.get('user-agent'))
    setAllowedModels(allowedModels)

    const homeHtml = new Home().html()
    const headHtml = template.site.htmlHead({title: 'Home for my Dome', inject: Sk8erMike.req.injectVars(req)})
    res.send(headHtml + homeHtml)
})

app.get(routes.modelIndex, async function (req, res) {
    global.document = {location: {href: req.url}}
    global.hfmd = {app: {visitWithPreload: (href, uniqueClass) => {}}}
    setIsMobile(req.get('user-agent'))

    const modelName = req.params.model
    const headHtml = template.site.htmlHead({title: modelName, inject: Sk8erMike.req.injectVars(req)});
    const [bodyHtml] = await new ModelIndex(modelName).htmlPromise()
    res.send(headHtml + bodyHtml)
})

app.get(routes.modelDetails, async function (req, res) {
    global.document = {location: {href: req.url}}
    global.hfmd = {app: {visitWithPreload: (href, uniqueClass) => {}}}
    setIsMobile(req.get('user-agent'))

    const model = req.params.model
    const id = req.params.id
    const [bodyHtml, component] = await new ModelDetail(model, id).htmlPromise()
    const title = component.getTitle()
    const headHtml = template.site.htmlHead({title: title, inject: Sk8erMike.req.injectVars(req)})
    res.send(headHtml + bodyHtml)

    // TODO set preloaded in injectVars and dont reload the first page on the frontend. 
    // That is currently why visitWithPreload isnt breaking right now
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

export default app