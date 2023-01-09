import { Element, $A, $Body, $Div, $H, $H1, $H2, $H3, $H4, $H5, $H6, $Head, $Hr, $Iframe, $Img, $Input, $Label, $Li, $Link, $P, $Pre, $Script, $Style, $Table, $Td, $Title, $Tr } from '../smalle/element.js'
import state from '../state.js'

const paragraph = ({id, type, data}) => 
    $P.id(id).type(type).style(state.activeStyle.paragraph).class(data.into ? 'intro' : undefined).push(
        data.text
    ).render()

const header = ({id, type, data}) => {
    const tag = 'h' + data.level
    return new $H.level(data.level).id(data.text).type(type).style(state.activeStyle[tag]).push(
        $A.href('#' + data.text).target('_self').push(
            data.text
        )
    ).render()
}

const imageFormat = (size='large') => ({id, type, data}) => 
    $Img.id(id).type(type).style(state.activeStyle.image)
        .src(data.file.formats[size].url)
        .alt(data.file.alternativeText)
        .render()

const image = ({id, type, data}) => 
    $Img.id(id).type(type).style(state.activeStyle.image)
        .src(data.file.url)
        .alt(data.file.alternativeText)
        .render()

const list = (listTag) => ({id, type, data}) => 
    new Element(listTag).id(id).type(type).push(
            data.items.map(item => $Li(item))
    ).render()

const listUnordered = list('ul');
const listOrdered = list('ol');

const embed = ({id, type, data}) => 
    $Iframe.id(id).type(type).height(data.height).width(data.width)
        .src(data.embed)
        .title(data.caption)
        .render()

const delimiter = ({id, type, data}) => 
    $Hr.id(id).type(type).style(state.activeStyle.delimiter).render()

const table = ({id, type, data}) => 
    $Table.id(id).type(type).style(state.activeStyle.table).push(
        data.content.map((row, i) => 
            $Tr.style(state.activeStyle.tableRow).push(
                row.map(column => 
                    (data.withHeadings && i == 0 ? $Th : $Td).style(state.activeStyle.tableData).push(
                        column
                    )
                )
            )
        )
    ).render()

// const templateFlexTable = //TODO FLEX TABLES 
const code = ({id, type, data}) => $Pre.id(id).type(type).push(data.code).render()
const raw = ({id, type, data}) => $Pre.id(id).type(type).push(data.html).render()

const link = ({id, type, data}) => 
    $Table.id(id).type(type).style(state.activeStyle.table).push(
        $Tr([
            $Td([
                $H3.style(state.activeStyle.h3).push(
                    $A.href(data.link).target('_blank').push(data.meta.title)
                ),
                $P(data.meta.description),
            ]),
            $Td(
                $A.href(data.link).target('_blank').push(
                    $Img.src(data.meta.image.url).style(state.activeStyle.linkImage)
                )
            ),
        ])
    ).render()

const checklist = ({id, type, data}) => 
    $Div.id(id).type(type).push(
        data.items.map((item, i) => 
            $P([
                $Input.type('checkbox').id(id + i).onclick('return false').checked(item.checked),
                $Label.for(id + i).push(item.text)
            ])
        )
    ).render()

export default {
    paragraph,
    header,
    imageFormat,
    image,
    list,
    listUnordered,
    listOrdered,
    embed,
    delimiter,
    table,
    code,
    raw,
    link,
    checklist
}