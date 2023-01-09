const imageSizes = {
    large: 'large',
    small: 'small',
    medium: 'medium',
    thumbnail: 'thumbnail'
}

const imageSize = imageSizes.large
const allowedModels = ['blogs']
const routes = {
    root: '/',
    modelIndex: '/:model',
    modelDetails: '/:model/:id',
}

export {
    imageSize,
    allowedModels,
    routes
}