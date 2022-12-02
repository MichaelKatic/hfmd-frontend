import * as dotenv from 'dotenv'
import { get } from 'https'
import express from 'express'

dotenv.config() //Allows usage of process.env.YOUR_VARS
const app = express()
const port = 3000

app.get('/', (req, res) => {
    res.send('Hey you! What the heck are you doing here?? Get the heck off my site!')
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
const linkImageStyle = 'height: 125px;'
const headderStyles = [
    // 'font-family: lust, serif;',
    // 'font-family: temeraire, serif; font-weight: 900; font-style: normal;',
    // 'font-family: miller-headline, serif; font-weight: 700; font-style: normal;',
    'font-family: miller-headline, serif; font-weight: 600; font-style: normal;',
    'font-family: abril-text, serif; font-weight: 600; font-style: normal;',
    'font-family: korolev, sans-serif; font-weight: 500; font-style: normal;',
    'font-family: korolev, sans-serif; font-weight: 400; font-style: normal;',
    'font-family: korolev, sans-serif; font-weight: 300; font-style: normal;',
    'font-family: korolev, sans-serif; font-weight: 200; font-style: normal;',
]
const paragraphStyle = 'font-family: le-monde-livre-classic-byol, serif; font-weight: 300; font-style: normal;'
const firstLetterStylye = 'font-family: le-monde-livre-classic-byol, serif; font-weight: 700; font-style: normal;'

const imageSize = {
    large: 'large',
    small: 'small',
    medium: 'medium',
    thumbnail: 'thumbnail'
}

// AMAZING FONT REFERENCE:
// https://xd.adobe.com/ideas/principles/web-design/best-modern-fonts-for-websites/
const templateHtmlHead = ({Title}) => `
    <head>
        <title>${Title}</title>
        <style>
            /* 
            html * {
                font-family: "Times New Roman", Times, serif;
            }
            $font-size: 1.15rem;
            $cap-size: $font-size * 6.25;
            */

            /* @supports (not(initial-letter: 5)) and (not(-webkit-initial-letter: 5)) { */
                .intro::first-letter {
                    font-family: le-monde-livre-classic-byol, serif; font-weight: 700; font-style: normal;
                    color: hsl(350, 50%, 50%);
                    font-size: 4rem;
                    float: left;
                    line-height: .7;
                    margin: 2px 2px 0 0;
                    color: DarkSlateGrey;
                }
            /*}*/
        </style>
        <link rel="stylesheet" href="https://use.typekit.net/whq2zsc.css"> <!--fonts from adobe-->
    </head>
`

const templateModelIndex = ({model, data}) => 
    data.map(item => 
        `<h2><a href="./${model}/${item.id}" target="_self">${item.attributes.Title}</a></h2>`
    ).join('')

const templateSlug = ({id='', model, Title}) => `<h1 id="${id}" style="${headderStyles[0]}"><a href="../${model}" target="_self">${model}</a> • ${Title}</h1>`
const templateTitle = ({id='', Title}) => `<h1 id="${id}" style="${headderStyles[0]}">${Title}</h1>`

const templateParagraph = ({id, type, data}) => `
    <p 
        id="${id}" 
        type="${type}" 
        style="${paragraphStyle}"
        ${data.into ? 'class="intro"' : ''}
    >
        ${data.text}
    </p>`
const templateHeader = ({id, type, data}) => `<h${data.level} id="${id}" type="${type}" style="${headderStyles[data.level - 1]}">${data.text}</h${data.level}>`
const templateImageFormat = (size='large') => ({id, type, data}) => `<img id="${id}" type="${type}" style="${imageStyle}" src="${data.file.formats[size].url}" alt="${data.file.alternativeText}">`
const templateImage = ({id, type, data}) => `<img id="${id}" type="${type}" style="${imageStyle}" src="${data.file.url}" alt="${data.file.alternativeText}">`
const templateList = (listTag) => ({id, type, data}) => `
    <${listTag} id="${id}" type="${type}">
        ${
            data.items.reduce((acc, cur) => 
                acc + `<li>${cur}</li>`
            , '')
        }
    </${listTag}>
`
const templateListUnordered = templateList('ul');
const templateListOrdered = templateList('ol');
const templateEmbed = ({id, type, data}) => `<iframe id="${id}" type="${type}" src="${data.embed}" height="${data.height}" width="${data.width}" title="${data.caption}"></iframe>`
const templateDelimiter = ({id, type, data}) => `<hr id="${id}" type="${type}" style="${delimiterStyle}">`
const templateTable = ({id, type, data}) => `
    <table id="${id}" type="${type}" style="${tableStyle}">
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
const templateCode = ({id, type, data}) => `<pre id="${id}" type="${type}">${data.code}</pre>`
const templateRaw = ({id, type, data}) => `<pre id="${id}" type="${type}">${data.html}</pre>`
const templateLink = ({id, type, data}) => `
    <table id="${id}" type="${type}" style="${linkTableStyle}">
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
    <div id="${id}" type="${type}">
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

const renderEditorJs = (blocks) => {
    const firstParagraphIndex = blocks.findIndex(block => block.type === "paragraph")
    blocks[firstParagraphIndex].data.into = true;
    return blocks.reduce((acc, cur) => 
        acc + mapTemplate(cur)
    , '');
}

const allowedModels = ['blogs']



app.get('/:model', function (req, res) {
    const model = req.params.model

    if (!allowedModels.includes(model))
    {
        res.status(401).send("Unauthorized")
        return
    }

    const fields = encodeURIComponent(['id','Title'].join(', '))

    getHelper(`https://cms.homeformydome.com/api/${model}?fields=${fields}`).then(
        response => {
            const headHtml = templateHtmlHead({Title: model});
            const titleHtml = templateTitle({Title: model})
            const data = response.data;
            const modelIndexHtml = templateModelIndex({model, data})
            res.send(headHtml + titleHtml + modelIndexHtml)
        },
        error => res.status(error.status).send(error.message)
    )
})

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
            const headHtml = templateHtmlHead({Title: response.data.attributes.Title});
            const titleHtml = templateSlug({
                id: response.data.id,
                Title: response.data.attributes.Title,
                model,
            })
            const editorJsBody = parseEditorJsBody(response.data.attributes.Body)
            const bodyHtml = renderEditorJs(editorJsBody.blocks)
            res.send(headHtml + titleHtml + bodyHtml)
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