import { get } from './hfmd.js'
import { editorJs, site } from './template/index.js'
import { state } from './state.js'
import { Element, $P } from './element/element.js'
import { mobileStyle, defaultStyle } from './style.js'

const setIsMobile = (userAgent) => {
    const isMobile = !!userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)
    state().set('isMobile', isMobile)
    state().set('activeStyle', isMobile ? mobileStyle : defaultStyle)
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
        case 'paragraph': return editorJs.paragraph({id, type, data})
        case 'header': return editorJs.header({id, type, data})
        case 'image': {
            switch(data.file.formats != null && data.file.formats[size] != null) {
                case true: return editorJs.imageFormat(size)({id, type, data})
                case false: return editorJs.image({id, type, data})
            }
        }
        case 'list': {
            switch(data.style) {
                case 'unordered': return editorJs.listUnordered({id, type, data})
                case 'ordered': return editorJs.listOrdered({id, type, data})
            }
        }
        case 'embed': return editorJs.embed({id, type, data})
        case 'delimiter': return editorJs.delimiter({id, type, data})
        case 'table': return editorJs.table({id, type, data})
        case 'code': return editorJs.code({id, type, data}) 
        case 'raw': return editorJs.raw({id, type, data}) 
        case 'LinkTool': return editorJs.link({id, type, data}) 
        case 'checklist': return editorJs.checklist({id, type, data}) 
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

    get(requestPath).then(
        response => state().set(statePath, response.data),
        error => console.log('error', error)
    )

    state().sub(statePath, (value, previousValue, path, relativePath) => {
        // const headHtml = template.site.htmlHead({title: value.attributes.Title, isMobile});
        const titleHtml = site.breadcrumb({
            id: value.id,
            title: value.attributes.Title,
            model
        })
        const editorJsBody = value.attributes.Body
        const bodyHtml = renderEditorJs(editorJsBody.blocks)
        const wrappedBodyHtml = site.wrapperBody({content: titleHtml + bodyHtml})

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
    //     response => state().set('cms.api.blogs.2', response.data),
    //     error => console.log('error', error)
    // )
}

window.loadTest = (id) => {
    console.log('app running!')

    setIsMobile(window.navigator.userAgent);

    const model = 'blogs'

    const statePath = `cms.api.${model}.${id}`
    const requestPath = `http://localhost:3000/${model}/${id}/raw`

    get(requestPath).then(
        response => state().set(statePath, response.data),
        error => console.log('error', error)
    )

    state().sub(statePath, (value, previousValue, path, relativePath) => {
        // const headHtml = template.site.htmlHead({title: value.attributes.Title, isMobile});
        const titleHtml = site.breadcrumb({
            id: value.id,
            title: value.attributes.Title,
            model
        })
        const editorJsBody = value.attributes.Body
        const bodyHtml = renderEditorJs(editorJsBody.blocks)
        const wrappedBodyHtml = site.wrapperBody({content: titleHtml + bodyHtml})

        document.body = Element.html(wrappedBodyHtml)
    })
}

export const run = runApp()