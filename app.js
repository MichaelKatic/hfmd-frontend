import * as dotenv from 'dotenv'
import https from 'https'
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

const imageStyle = 'width: 100%; object-fit: contain; display: block; margin-left: auto; margin-right: auto;'
const delimiterStyle = "height: 2px; border-width: 0; color: gray; background-color: gray;"
const tableStyle = 'width: 100%; border:1px solid black;'
const tableRowStyle = 'border:1px solid black;'
const tableDataStyle = 'border:1px solid black;'
const linkTableStyle = 'width: 100%; border:1px solid black;'
const linkImageStyle = 'height: 125px;'

const headderStyles = [
    // 'font-family: lust, serif;',
    // 'font-family: temeraire, serif; font-weight: 900; font-style: normal;',
    // 'font-family: miller-headline, serif; font-weight: 700; font-style: normal;',
    'font-family: miller-headline, serif; font-weight: 600; font-style: normal; font-size: 42px;',
    'font-family: abril-text, serif; font-weight: 600; font-style: normal;',
    'font-family: korolev, sans-serif; font-weight: 500; font-style: normal;',
    'font-family: korolev, sans-serif; font-weight: 400; font-style: normal;',
    'font-family: korolev, sans-serif; font-weight: 300; font-style: normal;',
    'font-family: korolev, sans-serif; font-weight: 200; font-style: normal;',
]
const paragraphStyle = 'text-align:justify; font-family: le-monde-livre-classic-byol, serif; font-weight: 400; font-style: normal; letter-spacing: .12px; color: #231f20; font-size: 17px; line-height: 25px;'
// const paragraphStyle = 'font-family: le-monde-livre-classic-byol, serif; font-weight: 300; font-style: normal;'
// const paragraphStyle = 'font-family: open-sans, sans-serif; font-weight: 300; font-style: normal;'
const firstLetterStylye = 'font-family: le-monde-livre-classic-byol, serif; font-weight: 700; font-style: normal;'
const wrapperStyle = () => `
    width: 95%; 
    ${!isMobile ? 'max-width: 600px;' : ''}
    object-fit: contain; 
    display: block; 
    margin: 0 auto; 
    padding: 20px 0;
`

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
            .intro::first-letter {
                font-family: le-monde-livre-classic-byol, serif; font-weight: 700; font-style: normal;
                color: hsl(350, 50%, 50%);
                font-size: 4rem;
                float: left;
                line-height: .7;
                margin: 2px 2px 0 0;
                color: DarkSlateGrey;
            }

            h1 a, h1 a:link, h1 a:visited, h1 a:focus, h1 a:active,
            h2 a, h2 a:link, h2 a:visited, h2 a:focus, h2 a:active {
                color: DarkSlateGray;
                text-decoration: none; 
            }
            h1 a:hover,
            h2 a:hover {
                color: green;
                text-decoration: none; 
            }
            
            p a, p a:link, p a:visited, p a:focus, p a:active {
                color: #026eea;
                text-decoration: underline; 
                background-image: url(https://xd.adobe.com/ideas/wp-content/uploads/2019/10/hover-blue-7.png);
                background-position: 0 12px;
                background-repeat: repeat-x;
                text-decoration: none;
            }

            p a:hover {
                color: #026eea;
                text-decoration: none;
            }
        </style>
        <link rel="stylesheet" href="https://use.typekit.net/whq2zsc.css"> <!--fonts from adobe-->
    </head>
`
const templateWrapperBody = ({content}) => `
    <div style="${wrapperStyle()}">${content}</div>
`
const templateModelIndex = ({model, data}) => 
    data.map(item => 
        `<h2 style="${headderStyles[1]}"><a href="./${model}/${item.id}" target="_self">${item.attributes.Title}</a></h2>`
    ).join('')

const templateSlug = ({id='', model, Title}) => `<h1 id="${id}" style="${headderStyles[0]}"><a href="../${model}" target="_self">${model}</a> • ${Title}</h1>`
const templateTitle = ({id, Title}) => `<h1 ${ id ? `id="${id}"` : ''} style="${headderStyles[0]}">${Title}</h1>`

const templateParagraph = ({id, type, data}) => `
    <p 
        id="${id}" 
        type="${type}" 
        style="${paragraphStyle}"
        ${data.into ? 'class="intro"' : ''}
    >
        ${data.text}
    </p>`
const templateHeader = ({id, type, data}) => `
    <h${data.level} id="${data.text}" type="${type}" style="${headderStyles[data.level - 1]}">
        <a href="#${data.text}" target="_self">${data.text}</a>
    </h${data.level}>
`
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
                const tag = data.withHeadings && i == 0 ? 'th' : 'td'
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
                <h3 style="${headderStyles[2]}"><a href="${data.link}" target="_blank">${data.meta.title}</a></h3>
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
let isMobile = false
const setIsMobile = (userAgent) => {
    isMobile = !!userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)
}

const serverError = (error, res) => {
    res.status(500).send(error.status + " " + error.message) //TODO user friendly errors
}

app.get('/:model', function (req, res) {
    const model = req.params.model

    if (!allowedModels.includes(model))
    {
        res.status(401).send("Unauthorized")
        return
    }

    setIsMobile(req.get('user-agent'))

    const fields = encodeURIComponent(['id','Title'].join(', '))

    getHelper(`https://cms.homeformydome.com/api/${model}?fields=${fields}`).then(
        response => {
            const headHtml = templateHtmlHead({Title: model});
            const titleHtml = templateTitle({Title: model})
            const data = response.data;
            const modelIndexHtml = templateModelIndex({model, data})
            const wrappedBodyHtml = templateWrapperBody({content: titleHtml + modelIndexHtml})
            res.send(headHtml + wrappedBodyHtml)
        },
        error => serverError(error, res)
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

    setIsMobile(req.get('user-agent'))

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
            const wrappedBodyHtml = templateWrapperBody({content: titleHtml + bodyHtml})
            res.send(headHtml + wrappedBodyHtml)
        },
        error => serverError(error, res)
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
        error => serverError(error, res)
    )
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})