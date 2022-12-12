const dotenv = require('dotenv')
const https = require('https')
const express = require('express')
// const e = require('./element/element.js')
const { 
    Element, 
    $A,
    $Body,
    $Division,
    $H,
    $H1,
    $H2,
    $H3,
    $H4,
    $H5,
    $H6,
    $Head,
    $Hr,
    $Iframe,
    $Img,
    $Input,
    $Label,
    $Li,
    $Link,
    $Paragraph,
    $Pre,
    $Style,
    $Table,
    $Td,
    $Title,
    $Tr
} = require('./element/element.js')

dotenv.config() //Allows usage of process.env.YOUR_VARS
const app = express()
const port = 3000

app.use(express.static('public'))

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

const styles = {
    image: 'width: 100%; object-fit: contain; display: block; margin-left: auto; margin-right: auto; border-radius: 10px;',
    delimiter: "height: 2px; border-width: 0; color: gray; background-color: gray;",
    table: 'width: 100%;',
    tableRow: '',
    tableData: '',
    linkTable: 'width: 100%; ',
    linkImage: 'height: 125px;',
    // 'font-family: lust, serif;',
    // 'font-family: temeraire, serif; font-weight: 900; font-style: normal;',
    // 'font-family: miller-headline, serif; font-weight: 700; font-style: normal;',
    title: `font-family: lust-script, sans-serif; font-weight: 700; font-style: normal; font-size: 50px;`,
    h1: `font-family: miller-headline, serif; font-weight: 600; font-style: normal; font-size: 42px;`,
    h2: `font-family: abril-text, serif; font-weight: 600; font-style: normal; font-size: 32px;`,
    h3: `font-family: korolev, sans-serif; font-weight: 500; font-style: normal; font-size: 26px;`,
    h4: `font-family: korolev, sans-serif; font-weight: 400; font-style: normal; font-size: 22px;`,
    h5: `font-family: korolev, sans-serif; font-weight: 300; font-style: normal; font-size: 20px;`,
    h6: `font-family: korolev, sans-serif; font-weight: 200; font-style: normal; font-size: 18px;`,
    paragraph: `text-align:justify; font-family: le-monde-livre-classic-byol, serif; font-weight: 400; font-style: normal; color: #231f20; font-size: 17px; line-height: 25px; letter-spacing: .12px;`,
    // paragraph: 'font-family: le-monde-livre-classic-byol, serif; font-weight: 300; font-style: normal;',
    // paragraph: 'font-family: open-sans, sans-serif; font-weight: 300; font-style: normal;',
    firstLetter: 'font-family: le-monde-livre-classic-byol, serif; font-weight: 700; font-style: normal; font-size: 65px; float: left; line-height: 45px; margin: 2px 2px 0 0; color: DarkSlateGrey;',
    wrapper: `
        width: 95%; 
        text-align: justify;
        text-size-adjust: none;
        object-fit: contain; 
        display: block; 
        margin: 0 auto; 
        padding: 20px 0;
        font-family: le-monde-livre-classic-byol, serif;
        font-size: 17px;
        max-width: 600px;
    `
}

//Replace instances of 123px with (123 * multiplier)px for certain css attributes.
const applyFontMultiplier = (style, multiplier) => {
    const patterns = {
        'font-size': /(letter-spacing:[\s]*)(\d*\.?\d+)([\s]*px)/, //^\d*\.?\d+$ match positive floats and numbers https://stackoverflow.com/questions/10921058/regex-matching-numbers-and-decimals
        'line-height': /(line-height:[\s]*)(\d*\.?\d+)([\s]*px)/, 
        'font-size': /(font-size:[\s]*)(\d*\.?\d+)([\s]*px)/, 
    }
    style = Object.values(patterns).reduce((accStyle, pattern) => {
        return accStyle.replace(pattern, (match, start, pixels, end) => {
            return start + (parseFloat(pixels) * multiplier) + end
        })
    }, style)
    return style
}

const removeMaxWidth = (style) => {
    return style.replace('max-width:[\s]*\d*\.?\d+px;', '');
}

const mobileStyles = JSON.parse(JSON.stringify(styles))
Object.keys(mobileStyles).forEach(key => mobileStyles[key] = applyFontMultiplier(mobileStyles[key], 2))
// mobileStyles.wrapper = removeMaxWidth(mobileStyles.wrapper)
mobileStyles.wrapper = `
        width: 95%; 
        text-size-adjust: none;
        object-fit: contain; 
        display: block; 
        margin: 0 auto; 
        padding: 20px 0;
        font-family: le-monde-livre-classic-byol, serif;
        font-size: 34px;
    `
let activeStyle = {}
let isMobile = false;

const imageSize = {
    large: 'large',
    small: 'small',
    medium: 'medium',
    thumbnail: 'thumbnail'
}

// Cool image styling
// https://www.w3schools.com/css/css3_images.asp

// Responsive website layouts:
// https://www.w3schools.com/css/tryit.asp?filename=trycss3_flexbox_website2

// AMAZING FONT REFERENCE:
// https://xd.adobe.com/ideas/principles/web-design/best-modern-fonts-for-websites/
const templateHtmlHead = ({title, isMobile}) => 
    $Head.push([
        $Title.push(title),
        $Style.push(`
            .intro::first-letter {
                ${activeStyle.firstLetter}
            }
        `),
        $Link.rel('stylesheet').type('text/css').href(`/css/style-${isMobile ? 'mobile' : 'desktop'}.css`),
        $Link.rel('stylesheet').type('text/css').href('/css/style.css'),
        $Link.rel('stylesheet').href('https://use.typekit.net/whq2zsc.css'), //Adobe font styles
        $Link.rel('icon').type('image/png').href('/favicon/coffee-16.ico'),
    ]).render()

const templateHome = ({models}) => 
    $H1.style(activeStyle.title).push([templateLogo(), ' Home for my Dome']).render() +
    $H1.style(activeStyle.h1).push(
        models.map(model => 
            $A.href('./' + model).target('_self').push(model)
        )
    ).render()

const templateWrapperBody = ({content}) => 
    $Body.push(
        $Division.style(activeStyle.wrapper).push(
            content
        )
    ).render()
    
const templateModelIndex = ({model, data}) => 
    data.map(item =>
        $H2.style(activeStyle.h2).push(
            $A.href('./' + model + '/' + item.id).target('_self').push(
                item.attributes.Title
            )
        ).render()
    ).join('')

const templateLogo = () => 
    $A.href('/').target('_self').push(
        $Img.src('/images/stewart.png').style('image-rendering: pixelated; height: 1em;')
    ).render()

const templateBreadcrumb = ({id='', model, title}) => 
    $H1.id(id).style(activeStyle.h1).push([
        templateLogo(),
        ' • ',
        $A.href('../' + model).target('_self').push(model),
        ' • ',
        title,
    ]).render()

const templateTitle = ({id, title}) => 
    $H1.id(id ?? undefined).style(activeStyle.h1).push(
        templateLogo() + ' • ' + title 
    ).render()

const templateParagraph = ({id, type, data}) => 
    $Paragraph.id(id).type(type).style(activeStyle.paragraph).class(data.into ? 'intro' : undefined).push(
        data.text
    ).render()

const templateHeader = ({id, type, data}) => {
    const tag = 'h' + data.level
    return new $H.level(data.level).id(data.text).type(type).style(activeStyle[tag]).push(
        $A.href('#' + data.text).target('_self').push(
            data.text
        )
    ).render()
}

const templateImageFormat = (size='large') => ({id, type, data}) => 
    $Img.id(id).type(type).style(activeStyle.image)
        .src(data.file.formats[size].url)
        .alt(data.file.alternativeText)
        .render()

const templateImage = ({id, type, data}) => 
    $Img.id(id).type(type).style(activeStyle.image)
        .src(data.file.url)
        .alt(data.file.alternativeText)
        .render()

const templateList = (listTag) => ({id, type, data}) => 
    new Element(listTag).id(id).type(type).push(
            data.items.map(item => new Element('li', '', item))
    ).render()

const templateListUnordered = templateList('ul');
const templateListOrdered = templateList('ol');

const templateEmbed = ({id, type, data}) => 
    $Iframe.id(id).type(type).height(data.height).width(data.width)
        .src(data.embed)
        .title(data.caption)
        .render()

const templateDelimiter = ({id, type, data}) => 
    $Hr.id(id).type(type).style(activeStyle.delimiter).render()

const templateTable = ({id, type, data}) => 
    $Table.id(id).type(type).style(activeStyle.table).push(
        data.content.map((row, i) => 
            $Tr.style(activeStyle.tableRow).push(
                row.map(column => 
                    (data.withHeadings && i == 0 ? $Th : $Td).style(activeStyle.tableData).push(
                        column
                    )
                )
            )
        )
    ).render()

// const templateFlexTable = //TODO FLEX TABLES 
const templateCode = ({id, type, data}) => $Pre.id(id).type(type).push(data.code).render()
const templateRaw = ({id, type, data}) => $Pre.id(id).type(type).push(data.html).render()

const templateLink = ({id, type, data}) => 
    $Table.id(id).type(type).style(activeStyle.table).push(
        $Tr.push([
            $Td.push([
                $H3.style(activeStyle.h3).push(
                    $A.href(data.link).target('_blank').push(data.meta.title)
                ),
                $Paragraph.push(data.meta.description),
            ]),
            $Td.push(
                $A.href(data.link).target('_blank').push(
                    $Img.src(data.meta.image.url).style(activeStyle.linkImage)
                )      
            ),
        ])
    ).render()

const templateChecklist = ({id, type, data}) => 
    $Division.id(id).type(type).push(
        data.items.map((item, i) => 
            $Paragraph.push([
                $Input.type('checkbox').id(id + i).onclick('return false').checked(item.checked),
                $Label.for(id + i).push(item.text)
            ])
        )
    ).render()

const templateDefault = ({id, type, data}) => 
    $Paragraph.push(`id: ${id} type: ${type} data: ${JSON.stringify(data)}`).render();

const mapTemplate = ({id, type, data}) => {
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
const setIsMobile = (userAgent) => {
    isMobile = !!userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)
    activeStyle = isMobile ? mobileStyles : styles;
}
const serverError = (error, res) => {
    res.status(500).send(error.status + " " + error.message) //TODO user friendly errors
}

app.get('/', (req, res) => {
    setIsMobile(req.get('user-agent'))

    const headHtml = templateHtmlHead({title: 'Home for my Dome', isMobile});
    const titleHtml = templateHome({models: allowedModels})
    const wrappedBodyHtml = templateWrapperBody({content: titleHtml})
    res.send(headHtml + wrappedBodyHtml)
})

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
            const headHtml = templateHtmlHead({title: model, isMobile});
            const titleHtml = templateTitle({title: model})
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
            const headHtml = templateHtmlHead({title: response.data.attributes.Title, isMobile});
            const titleHtml = templateBreadcrumb({
                id: response.data.id,
                title: response.data.attributes.Title,
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

module.exports = app;