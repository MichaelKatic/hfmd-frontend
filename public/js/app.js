const hfmd = require('./hfmd.js')
const template = require('./template/index.js')
const { state } = require('./state.js')
const { Element } = require('./element/element.js')
const { mobileStyle, defaultStyle } = require('./style.js')

const setIsMobile = (userAgent) => {
    isMobile = !!userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)
    state().set('isMobile', isMobile)
    state().set('activeStyle', isMobile ? mobileStyle : defaultStyle)
}

const run = () => {
    console.log('app running!')

    setIsMobile(window.navigator.userAgent);

    const model = 'blogs'
    const id = '2'

    const statePath = `cms.api.${model}.${id}`
    const requestPath = `http://localhost:3000/${model}/${id}/raw`

    hfmd.get(requestPath).then(
        response => state().set(statePath, response.data),
        error => console.log('error', error)
    )

    state().sub(statePath, (value, previousValue, path) => {
        // const headHtml = template.site.htmlHead({title: value.attributes.Title, isMobile});
        const titleHtml = template.site.breadcrumb({
            id: value.id,
            title: value.attributes.Title,
            model,
        })
        const editorJsBody = parseEditorJsBody(value.attributes.Body)
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
    //     response => state().set('cms.api.blogs.2', response.data),
    //     error => console.log('error', error)
    // )
}

module.exports = { run: run() }