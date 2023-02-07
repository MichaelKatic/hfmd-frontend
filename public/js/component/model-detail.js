import { Sk8erMike, Component }  from '../sk8ermike/index.js'
import { site, editorJs } from '../template/index.js'
import { $P } from '../smalle-extended/e.js'

export default class ModelDetail extends Component {
    constructor (modelName, id) {
        super(arguments)
        
        const statePath = `cms.api.${modelName}.${id}`
        const requestPath = `/data/${modelName}/${id}`

        this.rootNode('body')

        this.promiseToState(
            () => Sk8erMike.http.getPromise(requestPath),
            response => response.data,
            statePath
        )

        this.stateToLocals({
            id: statePath + '.id',
            attributes: statePath + '.attributes'
        })
        
        this.onRender(({id, attributes}) => {
            const titleHtml = site.breadcrumb({
                id: id,
                title: attributes.Title,
                model: modelName
            })
            const editorJsBody = attributes.Body
            const bodyHtml = renderEditorJs(editorJsBody.blocks)
            const wrappedBodyHtml = site.wrapperBody({content: titleHtml + bodyHtml})

            return wrappedBodyHtml
        })
    }

    getTitle = () => {
        return !this.preload? this.locals().attributes.Title : ''
    }
}

const templateDefault = ({id, type, data}) => 
    $P.push(`id: ${id} type: ${type} data: ${JSON.stringify(data)}`).render()

const mapTemplate = ({id, type, data}) => {    
    const imageSize = {
        large: 'large',
        small: 'small',
        medium: 'medium',
        thumbnail: 'thumbnail'
    }
    const size = imageSize.large
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
    if (firstParagraphIndex !== -1) {
        blocks[firstParagraphIndex].data.into = true
    }
    return blocks.reduce((acc, cur) => 
        acc + mapTemplate(cur)
    , '')
}