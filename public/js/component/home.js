import { Component }  from '../sk8ermike/index.js'
import { site } from '../template/index.js'

const component = new Component('body')

component.stateToLocals({
    allowedModels: 'allowedModels',
    isMobile: 'isMobile',
    activeStyle: 'activeStyle'
})

// home.useState({
//     allowedModels: 'allowedModels',
//     isMobile: 'isMobile',
//     activeStyle: 'activeStyle'
// }, 'default')

component.onRender(({allowedModels}) => {
    const titleHtml = site.home({models: allowedModels})
    const wrappedBodyHtml = site.wrapperBody({content: titleHtml})
    return wrappedBodyHtml
})

// home.useState({
//     isMobile: 'isMobile',
//     activeStyle: 'activeStyle'
// }, 'testView') //testView only

// home.onRender(state => {
//     const titleHtml = `<p>You are dumb + ${JSON.stringify(state)}</p>`
//     const wrappedBodyHtml = site.wrapperBody({content: titleHtml})
//     return wrappedBodyHtml
// }, 'testView')

export default component