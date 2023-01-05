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

const mobileStyles = JSON.parse(JSON.stringify(styles))
Object.keys(mobileStyles).forEach(key => mobileStyles[key] = applyFontMultiplier(mobileStyles[key], 2))

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

module.exports = {
    defaultStyle: styles,
    mobileStyle: mobileStyles
}