//External libs
import express from 'express'
import path from 'path'

import hfmd from './hfmd.js'
import template from './template/index.js'
import '../public/js/lodash/core.js'
import { home, modelIndex } from '../public/js/component/index.js'
import state from '../public/js/sk8ermike/state.js'
import style from '../public/js/style.js'
import {allowedModels, routes} from '../public/js/app-config.js'

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

    const parseEditorJsBody = (body) => {
        body.replace('\\\\"', '\"').replace('\\"', '\'')
        return JSON.parse(body)
    }

    hfmd.get(`https://cms.homeformydome.com/api/${model}/${id}`).then(
        response => {
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

    hfmd.get(`https://cms.homeformydome.com/api/${model}?fields=${fields}`).then(
        response => res.json(response),
        error => serverDataError(error, res)
    )
})

const injectVars = (req, serverRendered=false) => {
    return `
        if (typeof(window.hfmd) === 'undefined') { window.hfmd = {} } 
        window.hfmd.routePattern = '${req.route.path}'
        window.hfmd.params = ${JSON.stringify(req.params)}`
}

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
    setIsMobile(req.get('user-agent'))
    setAllowedModels(allowedModels)
    const headHtml = template.site.htmlHead({title: 'Home for my Dome', inject: injectVars(req)})
    res.send(headHtml + home.html())
})

app.get(routes.modelIndex, function (req, res) {
    global.document = {location: {href: req.url}}
    global.hfmd = {app: {visitWithPreload: (href, uniqueClass) => {}}}
    setIsMobile(req.get('user-agent'))
    const modelName = req.params.model
    const headHtml = template.site.htmlHead({title: modelName, inject: injectVars(req)});
    modelIndex.init(modelName)
    modelIndex.htmlPromise().then(body => {
        res.send(headHtml + body)
    })
})

app.get(routes.modelDetails, function (req, res) {
    setIsMobile(req.get('user-agent'))
    const model = req.params.model
    const id = req.params.id
    
    //TODO get and populate title so it works with web scrapers. Maybe require title and image url in params

    const headHtml = template.site.htmlHead({title: 'client side rendering test', inject: injectVars(req)})
    res.send(headHtml)
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

export default app