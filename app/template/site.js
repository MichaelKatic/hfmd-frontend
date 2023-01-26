import { Element, $A, $Body, $Div, $H, $H1, $H2, $H3, $H4, $H5, $H6, $Head, $Hr, $Iframe, $Img, $Input, $Label, $Li, $Link, $P, $Pre, $Script, $Style, $Table, $Td, $Title, $Tr } from '../../public/js/smalle/e.js'
import state from '../../public/js/sk8ermike/state.js'
import fs from 'fs/promises'

const getFileList = async (directory, type, basePath='') => {
    let files = []

    if (basePath == '') {
        basePath = directory + '/';
    }

    for (const path of await fs.readdir(directory)) {
        const fullPath = directory + '/' + path
        if (!path.includes('.')) {
            files = files.concat(await getFileList(fullPath, type, basePath))
        } else if (path.includes('.' + type)) {
            files.push(fullPath.substring(basePath.length))
        }
    }

    return files
} 

const htmlHead = ({title, inject=null}) => 
    $Head([
        $Title(title),
        $Style(`
            .intro::first-letter {
                ${state.activeStyle.firstLetter}
            }
        `),
        $Link.rel('stylesheet').type('text/css').href(`/css/style-${state.isMobile ? 'mobile' : 'desktop'}.css`).async(),
        $Link.rel('stylesheet').type('text/css').href('/css/style.css').async(),
        $Link.rel('stylesheet').href('https://use.typekit.net/whq2zsc.css').async(), //Adobe font styles
        $Link.rel('icon').type('image/png').href('/favicon/coffee-16.ico').async(),
        // $Script.type('text/javascript').src('/node_modules/clientside-require/dist/bundle.js'), // Allow node style export/import
        // $Script('window.home = {}').type('text/javascript'),
        // $Script.type('application/javascript').src(`/js/jq/core.js`),
        inject ? $Script(inject).type('application/javascript') : '',
        $Script.type('application/javascript').src(`/js/lodash/core.js`),
        // [
        //     'smalle/element.js',
        //     'hfmd.js',
        //     'state.js',
        //     'style.js',
        //     'template/editor-js.js',
        //     'template/index.js',
        //     'template/site.js',
        // ].map(file => $Script.type('module').src(`/js/${file}`).render()),
        $Script.type('module').src('/js/app.js'),
        // new Promise(resolve => resolve(
        //     $Script.type('module').src('/js/app.js').render()
        // ))
        
            
        // new Promise(resolve => 
        //     getFileList('public/js', 'js').then(files => resolve(
        //         $Script(files.map(file => loadFunction(file)))
        //             .type('text/javascript')
        //             .render() // It's sloppy that you have to call render here.
        //     ))
        // ),

        // $Script('window.e.app.run()').type('text/javascript'),
        // new Promise(resolve => 
        //     //Client side js
        //     getFileList('public/js', 'js').then(files => resolve(files.map(file => $Script.type('text/javascript').src(`/js/${file}`))))
        // ),
    ]).render()

export default {
    htmlHead,
}