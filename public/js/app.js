import hfmd from './hfmd.js'
import template from './template/index.js'
import state from './state.js'
import { Element, $P } from './element/element.js'
import style from './style.js'

const setIsMobile = (userAgent) => {
    const isMobile = !!userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)
    state.set('isMobile', isMobile)
    state.set('activeStyle', isMobile ? style.mobileStyle : style.defaultStyle)
}

const templateDefault = ({id, type, data}) => 
    $P.push(`id: ${id} type: ${type} data: ${JSON.stringify(data)}`).render();

const mapTemplate = ({id, type, data}) => {    
    const imageSize = {
        large: 'large',
        small: 'small',
        medium: 'medium',
        thumbnail: 'thumbnail'
    }
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

const runApp = () => {
    console.log('app running!')

    setIsMobile(window.navigator.userAgent);

    const model = 'blogs'
    const id = '2'

    const statePath = `cms.api.${model}.${id}`
    const requestPath = `http://localhost:3000/${model}/${id}/raw`

    //This should be a helper function and should check the state path and only request if undefined.
    // populate(statePath, withData => {
    //     hfmd.get(requestPath).then(
    //         response => withData(response.data),
    //         error => console.log('error', error)
    //     )
    // })
    hfmd.get(requestPath).then(
        response => state.set(statePath, response.data),
        error => console.log('error', error)
    )

    state.sub(statePath, (value, previousValue, path, relativePath) => {
        // const headHtml = template.site.htmlHead({title: value.attributes.Title, isMobile});
        const titleHtml = template.site.breadcrumb({
            id: value.id,
            title: value.attributes.Title,
            model
        })
        const editorJsBody = value.attributes.Body
        const bodyHtml = renderEditorJs(editorJsBody.blocks)
        const wrappedBodyHtml = template.site.wrapperBody({content: titleHtml + bodyHtml})

        document.body = Element.html(wrappedBodyHtml)
    })

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

    // hfmd.get('http://localhost:3000/blogs/2/raw').then(
    //     response => state.set('cms.api.blogs.2', response.data),
    //     error => console.log('error', error)
    // )
}

window.loadTest = (id) => {
    console.log('app running!')

    setIsMobile(window.navigator.userAgent);

    const model = 'blogs'

    const statePath = `cms.api.${model}.${id}`
    const requestPath = `http://localhost:3000/${model}/${id}/raw`

    hfmd.get(requestPath).then(
        response => state.set(statePath, response.data),
        error => console.log('error', error)
    )

    state.sub(statePath, (value, previousValue, path, relativePath) => {
        // const headHtml = template.site.htmlHead({title: value.attributes.Title, isMobile});
        const titleHtml = template.site.breadcrumb({
            id: value.id,
            title: value.attributes.Title,
            model
        })
        const editorJsBody = value.attributes.Body
        const bodyHtml = renderEditorJs(editorJsBody.blocks)
        const wrappedBodyHtml = template.site.wrapperBody({content: titleHtml + bodyHtml})

        document.body = Element.html(wrappedBodyHtml)
    })
}

export const run = runApp()