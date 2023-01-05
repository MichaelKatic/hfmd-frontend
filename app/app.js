const express = require('express')
const path = require('path')
const cms = require('./hfmd-cms.js')
const template = require('./template/index.js')
const { state } = require('./state.js')
const {mobileStyle, defaultStyle} = require('./style.js')


const app = express()
const port = 3000

app.use(express.static('public'))

const parseEditorJsBody = (body) => {
    body.replace('\\\\"', '\"').replace('\\"', '\'')
    return JSON.parse(body)
}

const imageSize = {
    large: 'large',
    small: 'small',
    medium: 'medium',
    thumbnail: 'thumbnail'
}

// Cool image styling
// https://www.w3schools.com/css/css3_images.asp

// Responsive website layouts:
// https://www.w3schools.com/css/tryit.asp?filename=trycss3_flexbox_website2

// AMAZING FONT REFERENCE:
// https://xd.adobe.com/ideas/principles/web-design/best-modern-fonts-for-websites/


const templateDefault = ({id, type, data}) => 
    $P.push(`id: ${id} type: ${type} data: ${JSON.stringify(data)}`).render();

const mapTemplate = ({id, type, data}) => {
    const size = imageSize.large;
    switch(type) {
        case 'paragraph': return template.editorJs.paragraph({id, type, data})
        case 'header': return template.editorJs.header({id, type, data})
        case 'image': {
            switch(data.file.formats != null && data.file.formats[size] != null) {
                case true: return template.editorJs.imageFormat(size)({id, type, data})
                case false: return template.editorJs.image({id, type, data})
            }
        }
        case 'list': {
            switch(data.style) {
                case 'unordered': return template.editorJs.listUnordered({id, type, data})
                case 'ordered': return template.editorJs.listOrdered({id, type, data})
            }
        }
        case 'embed': return template.editorJs.embed({id, type, data})
        case 'delimiter': return template.editorJs.delimiter({id, type, data})
        case 'table': return template.editorJs.table({id, type, data})
        case 'code': return template.editorJs.code({id, type, data}) 
        case 'raw': return template.editorJs.raw({id, type, data}) 
        case 'LinkTool': return template.editorJs.link({id, type, data}) 
        case 'checklist': return template.editorJs.checklist({id, type, data}) 
    }
    
    return templateDefault({id, type, data})
}

const renderEditorJs = (blocks) => {
    const firstParagraphIndex = blocks.findIndex(block => block.type === "paragraph")
    blocks[firstParagraphIndex].data.into = true;
    return blocks.reduce((acc, cur) => 
        acc + mapTemplate(cur)
    , '');
}

const allowedModels = ['blogs']
const setIsMobile = (userAgent) => {
    isMobile = !!userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)
    state.set('isMobile', isMobile)
    state.set('activeStyle', isMobile ? mobileStyle : defaultStyle)
}
const serverError = (error, res) => {
    res.status(500).send(error.status + " " + error.message) //TODO user friendly errors
}

app.get('/', (req, res) => {
    setIsMobile(req.get('user-agent'))

    const headHtml = template.site.htmlHead({title: 'Home for my Dome', isMobile});
    const titleHtml = template.site.home({models: allowedModels})
    const wrappedBodyHtml = template.site.wrapperBody({content: titleHtml})
    res.send(headHtml + wrappedBodyHtml)
})

app.get('/:model', function (req, res) {
    const model = req.params.model

    if (!allowedModels.includes(model))
    {
        res.status(401).send("Unauthorized")
        return
    }

    setIsMobile(req.get('user-agent'))

    const fields = encodeURIComponent(['id','Title'].join(', '))

    cms.get(`https://cms.homeformydome.com/api/${model}?fields=${fields}`).then(
        response => {
            const headHtml = template.site.htmlHead({title: model, isMobile});
            const titleHtml = template.site.title({title: model})
            const data = response.data;
            const modelIndexHtml = template.site.modelIndex({model, data})
            const wrappedBodyHtml = template.site.wrapperBody({content: titleHtml + modelIndexHtml})
            res.send(headHtml + wrappedBodyHtml)
        },
        error => serverError(error, res)
    )
})

// const allowedNodeModules = [
//     'clientside-require/dist/bundle.js',
//     'https/package.json',
//     'lodash/package.json ',
//     'fs/package.json',
//     'lodash/package.json',
// ]

const allowedNodeModules = [
    // 'util', // Not sure what is requiring this. 
    'clientside-require',
    // 'node:https',
    // 'lodash',
    // 'jquery',
    // 'fs',
]

//js/template/element/element.js 

app.get('/node_modules/:nodeModule/:nodePath(*)', function (req, res) {
    const nodeModule = req.params.nodeModule
    const nodePath = req.params.nodePath

    if (nodeModule.includes('node:'))
    {
        //Fucked   
    }

    if (!allowedNodeModules.includes(nodeModule))
    {
        res.status(401).send("Unauthorized")
        return
    }

    res.sendFile(req.url, {root: path.join(__dirname, '../')}, function (err) {
        if (err) {
            res.status(404).send("Not found")
        } else {
            console.log('Sent:', req.url);
        }
    })
})

app.get('/:model/:id', async function (req, res) {
    const model = req.params.model
    const id = req.params.id

    if (!allowedModels.includes(model))
    {
        res.status(401).send("Unauthorized")
        return
    }

    setIsMobile(req.get('user-agent'))

    requestPath = `https://cms.homeformydome.com/api/${model}/${id}`
    statePath = `cms.api.${model}.${id}`

    template.site.htmlHead({title: 'client side rendering test', isMobile}).then(headHtml => {
        res.send(headHtml)
    })

    // const headHtml = await template.site.htmlHead({title: 'client side rendering test', isMobile})
    // res.send(headHtml)

    //------------------------------------------

    // cms.get(requestPath).then(
    //     response => state.set(statePath, response.data),
    //     error => serverError(error, res)
    // )

    // state.sub(statePath, (value, previousValue, path) => {
    //     const headHtml = template.site.htmlHead({title: value.attributes.Title, isMobile});
    //     const titleHtml = template.site.breadcrumb({
    //         id: value.id,
    //         title: value.attributes.Title,
    //         model,
    //     })
    //     const editorJsBody = parseEditorJsBody(value.attributes.Body)
    //     const bodyHtml = renderEditorJs(editorJsBody.blocks)
    //     const wrappedBodyHtml = template.site.wrapperBody({content: titleHtml + bodyHtml})
    //     res.send(headHtml + wrappedBodyHtml)
    // })

    //------------------------------------------

    // cms.get(`https://cms.homeformydome.com/api/${model}/${id}`).then(
    //     response => {
    //         const headHtml = template.site.htmlHead({title: response.data.attributes.Title, isMobile});
    //         const titleHtml = template.site.breadcrumb({
    //             id: response.data.id,
    //             title: response.data.attributes.Title,
    //             model,
    //         })
    //         const editorJsBody = parseEditorJsBody(response.data.attributes.Body)
    //         const bodyHtml = renderEditorJs(editorJsBody.blocks)
    //         const wrappedBodyHtml = template.site.wrapperBody({content: titleHtml + bodyHtml})
    //         res.send(headHtml + wrappedBodyHtml)
    //     },
    //     error => serverError(error, res)
    // )
})

app.get('/:model/:id/raw', function (req, res) {
        const model = req.params.model
    const id = req.params.id

    if (!allowedModels.includes(model))
    {
        res.status(401).send("Unauthorized")
        return
    }

    cms.get(`https://cms.homeformydome.com/api/${model}/${id}`).then(
        response => {
            response.data.attributes.Body = parseEditorJsBody(response.data.attributes.Body)
            res.json(response)
        },
        error => serverError(error, res)
    )
})

// app.get('cms/:model/:id', function (req, res) {
//     const model = req.params.model
//     const id = req.params.id

//     if (!allowedModels.includes(model))
//     {
//         res.status(401).send("Unauthorized")
//         return
//     }

//     cms.get(`https://cms.homeformydome.com/api/${model}/${id}`).then(
//         response => {
//             response.data.attributes.Body = parseEditorJsBody(response.data.attributes.Body)
//             res.json(response)
//         },
//         error => serverError(error, res)
//     )
// })

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

module.exports = app;