//External libs
import express from 'express'
import jsdom from 'jsdom'
import '../public/js/lodash/core.js'
import hfmdCms from './hfmd-cms.js'
import { allowedModels, routes } from '../public/js/app-config.js'
import { Sk8erMike, state } from '../public/js/sk8ermike/index.js'
import { Head, Home, ModelIndex, ModelDetail } from '../public/js/component/index.js'
import '../public/js/app.js'
import style from '../public/js/style.js'

const app = Sk8erMike.config({routes}, express, jsdom) // TODO doc this. Just like using exspress: // const app = express(). Then can use skatermike or exspress routing!

const port = 3000

app.use(express.static('public'))

// Cool image styling
// https://www.w3schools.com/css/css3_images.asp

// Responsive website layouts:
// https://www.w3schools.com/css/tryit.asp?filename=trycss3_flexbox_website2

// AMAZING FONT REFERENCE:
// https://xd.adobe.com/ideas/principles/web-design/best-modern-fonts-for-websites/

const serverDataError = (error, res) => {
    res.json({error: error})
}

const copy = value => {
    if (typeof value === 'object') {
        return JSON.parse(JSON.stringify(value))
    } else {
        return value
    }
}

app.get('/data/:model/:id', function (req, res) {
    const model = req.params.model
    const id = req.params.id

    if (!allowedModels.includes(model))
    {
        res.status(401).send("Unauthorized")
        return
    }

    hfmdCms.get(`/api/${model}/${id}`).then(
        response => {
            const parsedResponse = copy(response) // Modifying the response object was causing an issue. 
            const parseEditorJsBody = (body) => {
                body.replace('\\\\"', '\"').replace('\\"', '\'')
                return JSON.parse(body)
            }
            parsedResponse.data.attributes.Body = parseEditorJsBody(response.data.attributes.Body)
            console.log('\n\nurl: ' + `/api/${model}/${id}` + '---------------')
            console.log(parsedResponse)
            res.json(parsedResponse)
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

    hfmdCms.get(`/api/${model}?fields=${fields}`).then(
        response => {
            console.log('\n\nurl: ' + `/api/${model}?fields=${fields}` + '---------------')
            console.log(response)
            return res.json(response)
        },
        error => serverDataError(error, res)
    )
})

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

app.sk8erMikeRoutes()

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

export default app