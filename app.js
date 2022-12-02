import * as dotenv from 'dotenv'
import { get } from 'https'
import express from 'express'

dotenv.config() //Allows usage of process.env.YOUR_VARS
const app = express()
const port = 3000

app.get('/', (req, res) => {
    res.send('Hello World!')
})

const getHelper = (url) => new Promise((resolve, reject) => {
    const options = {
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${process.env.HFMD_API_TOKEN}`
        }
    }
    https.get(url, options, (res) => {
        console.log('statusCode:', res.statusCode);
        console.log('headers:', res.headers);

        res.on('data', (d) => {
            process.stdout.write(d);
        });

        res.setEncoding('utf8');
        let rawData = '';

        res.on('data', (chunk) => {
            rawData += chunk;
        });

        res.on('end', () => {
            try {
                const parsedData = JSON.parse(rawData);
                if (res.statusCode >= 200 && res.statusCode < 300)
                {
                    resolve(parsedData);
                }
                else
                {
                    reject(parsedData.error);
                }
            } catch (error) {
                reject(error);
            }
        });

    }).on('error', (error) => {
        reject(error);
    });
});

const parseEditorJsBody = (body) => {
    body.replace('\\\\"', '\"').replace('\\"', '\'')
    return JSON.parse(body)
}

const imageStyle = 'width: 100%; max-width:1000px; object-fit: contain; display: block; margin-left: auto; margin-right: auto;'
const delimiterStyle = "height: 2px; border-width: 0; color: gray; background-color: gray;"
const tableStyle = 'width: 100%; max-width:1000px; border:1px solid black;'
const tableRowStyle = 'border:1px solid black;'
const tableDataStyle = 'border:1px solid black;'
const linkTableStyle = 'width: 100%; max-width:1000px; border:1px solid black;'
const linkImageStyle = 'width:100px; height:100px;'

const imageSize = {
    large: 'large',
    small: 'small',
    medium: 'medium',
    thumbnail: 'thumbnail'
}

const templateTitle = ({id, Title}) => `<H1 id=${id}>${Title}</H1>`
const templateParagraph = ({id, type, data}) => `<p id=${id} type=${type}>${data.text}</p>`
const templateHeader = ({id, type, data}) => `<h${data.level} id=${id} type=${type}>${data.text}</h${data.level}>`
const templateImageFormat = (size='large') => ({id, type, data}) => `<img id=${id} type=${type} style='${imageStyle}' src="${data.file.formats[size].url}" alt="${data.file.alternativeText}">`
const templateImage = ({id, type, data}) => `<img id=${id} type=${type} style='${imageStyle}' src="${data.file.url}" alt="${data.file.alternativeText}">`
const templateList = (listTag) => ({id, type, data}) => `
    <${listTag} id=${id} type=${type}>
        ${
            data.items.reduce((acc, cur) => 
                acc + `<li>${cur}</li>`
            , '')
        }
    </${listTag}>
`
const templateListUnordered = templateList('ul');
const templateListOrdered = templateList('ol');
const templateEmbed = ({id, type, data}) => `<iframe id=${id} type=${type} src="${data.embed}" height="${data.height}" width="${data.width}" title="${data.caption}"></iframe>`
const templateDelimiter = ({id, type, data}) => `<hr id=${id} type=${type} style="${delimiterStyle}">`
const templateTable = ({id, type, data}) => `
    <table id=${id} type=${type} style="${tableStyle}">
        ${
            data.content.reduce((trAcc, trCur, i) => {
                tag = data.withHeadings && i == 0 ? 'th' : 'td'
                return trAcc + `
                    <tr style="${tableRowStyle}">
                        ${trCur.reduce((tdAcc, tdCur) => tdAcc + `<${tag} style="${tableDataStyle}">${tdCur}</${tag}>`, '')}
                    </tr>
                `
            }, '')
        }
    </table>
`
const templateCode = ({id, type, data}) => `<pre id=${id} type=${type}>${data.code}</pre>`
const templateRaw = ({id, type, data}) => `<pre id=${id} type=${type}>${data.html}</pre>`
const templateLink = ({id, type, data}) => `
    <table id=${id} type=${type} style="${linkTableStyle}">
        <tr> 
            <td>
                <h3><a href="${data.link}" target="_blank">${data.meta.title}</a></h3>
                <p>${data.meta.description}</p>
            </td>
            <td>
                <a href="${data.link} target="_blank"">
                    <img src="${data.meta.image.url}" style="${linkImageStyle}">
                </a>
            </td>
        </tr> 
    </table>
`
const templateChecklist = ({id, type, data}) => `
    <div id=${id} type=${type}>
        ${
            data.items.reduce((acc, cur, i) => {
                const checked = cur.checked ? 'checked' : ''
                return acc + `
                    <p>
                        <input type="checkbox" id="${id + i}" onclick="return false;" ${checked}/>
                        <label for="${id + i}">${cur.text}</label>
                    </p>
                `
            }, '')
        }
    </div>
`

const mapTemplate = ({id, type, data}) => {
    const templateDefault = ({id, type, data}) => `<p>id: ${id} type: ${type} data: ${JSON.stringify(data)}</p>`;;
    const size = imageSize.large;

    switch(type) {
        case 'paragraph': return templateParagraph({id, type, data})
        case 'header': return templateHeader({id, type, data})
        case 'image': {
            switch(data.file.formats != null && data.file.formats[size] != null) {
                case true: return templateImageFormat(size)({id, type, data})
                case false: return templateImage({id, type, data})
            }
        }
        case 'list': {
            switch(data.style) {
                case 'unordered': return templateListUnordered({id, type, data})
                case 'ordered': return templateListOrdered({id, type, data})
            }
        }
        case 'embed': return templateEmbed({id, type, data})
        case 'delimiter': return templateDelimiter({id, type, data})
        case 'table': return templateTable({id, type, data})
        case 'code': return templateCode({id, type, data}) 
        case 'raw': return templateRaw({id, type, data}) 
        case 'LinkTool': return templateLink({id, type, data}) 
        case 'checklist': return templateChecklist({id, type, data}) 
    }
    
    return templateDefault({id, type, data})
}

const renderEditorJs = (blocks) => blocks.reduce((acc, cur) => 
    acc + mapTemplate(cur)
, '');

const allowedModels = ['blogs']

app.get('/:model/:id', function (req, res) {
    const model = req.params.model
    const id = req.params.id

    if (!allowedModels.includes(model))
    {
        res.status(401).send("Unauthorized")
        return
    }

    getHelper(`https://cms.homeformydome.com/api/${model}/${id}`).then(
        response => {
            const titleHtml = templateTitle({
                Title: response.data.attributes.Title,
                id: response.data.id
            })

            const editorJsBody = parseEditorJsBody(response.data.attributes.Body)
            const bodyHtml = renderEditorJs(editorJsBody.blocks)
            res.send(titleHtml + bodyHtml)
        },
        error => res.status(error.status).send(error.message)
    )
})

app.get('/:model/:id/raw', function (req, res) {
    const model = req.params.model
    const id = req.params.id

    if (!allowedModels.includes(model))
    {
        res.status(401).send("Unauthorized")
        return
    }

    getHelper(`https://cms.homeformydome.com/api/${model}/${id}`).then(
        response => {
            response.data.attributes.Body = parseEditorJsBody(response.data.attributes.Body)
            res.send(response)
        },
        error => res.status(error.status).send(error.message)
    )
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})