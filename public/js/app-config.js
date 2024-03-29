const imageSizes = {
    large: 'large',
    small: 'small',
    medium: 'medium',
    thumbnail: 'thumbnail'
}
const imageSize = imageSizes.large
const allowedModels = ['blogs']
const routes = { // Must be unique
    root: '/',
    modelIndex: '/:model',
    modelDetails: '/:model/:id',
}
const settings = {
    // renderHeader: 'server', //Render on server so it's not missed by seo.
    // renderBody: 'server', //Render on server so it's not missed by seo.
    // renderUrlChange: 'client' //Render on client because it shouldn't matter.
}

export {
    imageSize,
    allowedModels,
    routes,
    settings
}