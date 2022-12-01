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
    get(url, options, (res) => {
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
    body.replace('\\\\"', '\"').replace('\\"', '\'');
    return JSON.parse(body);
}

const imageStyle = 'width: 100%; max-width:1000px; object-fit: contain; display: block; margin-left: auto; margin-right: auto;'
const delimiterStyle = "height: 2px; border-width: 0; color: gray; background-color: gray";

const imageSize = {
    large: 'large',
    small: 'small',
    medium: 'medium',
    thumbnail: 'thumbnail'
}

const templateTitle = ({id, Title}) => `<H1 id=${id}>${Title}</H1>`;
const templateParagraph = ({id, type, data}) => `<p id=${id} type=${type}>${data.text}</p>`
const templateHeader = ({id, type, data}) => `<h${data.level} id=${id} type=${type}>${data.text}</h${data.level}>`
const templateImageFormat = (size='large') => ({id, type, data}) => `<img id=${id} type=${type} style='${imageStyle}' src="${data.file.formats[size].url}" alt="${data.file.alternativeText}">`
const templateImage = ({id, type, data}) => `<img id=${id} type=${type} style='${imageStyle}' src="${data.file.url}" alt="${data.file.alternativeText}">`
const templateList = (listTag) => ({id, type, data}) => 
    `<${listTag} id=${id} type=${type}>` + 
    data.items.reduce(
        (acc, cur) => acc + `<li>${cur}</li>`,
        ""
    ) + 
    `</${listTag}>`
;
const templateListUnordered = templateList('ul');
const templateListOrdered = templateList('ol');
const templateEmbed = ({id, type, data}) => `<iframe id=${id} type=${type} src="${data.embed}" height="${data.height}" width="${data.width}" title="${data.caption}"></iframe>`
const templateDelimiter = ({id, type, data}) => `<hr style="${delimiterStyle}">`

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
    }
    
    return templateDefault({id, type, data})
}

const renderEditorJs = (blocks) => blocks.reduce(
    (acc, cur) => acc + mapTemplate(cur), 
    ""
);

app.get('/:model/:id', function (req, res) {
    const model = req.params.model //TODO DANGEROSO
    const id = req.params.id

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
    const model = req.params.model //TODO DANGEROSO
    const id = req.params.id
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