export const getHtmlTemplate = (gcaptcha = false) => {
    return (

`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>repl</title>
    <link rel="icon" href="/img/favicon2.ico" type="image/x-icon">
    <style>
        @font-face {
            font-family: "JetBrains Mono";
            src: url('/font/JetBrainsMono-Medium.woff2');
        }
        @font-face {
            font-family: 'Roboto';
            font-style: normal;
            font-weight: 400;
            src: local(''),
            url('/font/roboto-v30-latin_cyrillic-ext_cyrillic-regular.woff2') format('woff2'), /* Super Modern Browsers */
            url('/font/roboto-v30-latin_cyrillic-ext_cyrillic-regular.woff') format('woff'), /* Modern Browsers */
            url('/font/roboto-v30-latin_cyrillic-ext_cyrillic-regular.ttf') format('truetype') /* Safari, Android, iOS */
        }
        @font-face {
            font-family: 'Roboto';
            font-style: normal;
            font-weight: 700;
            src: local(''),
            url('/font/roboto-v30-latin_cyrillic-ext_cyrillic-700.woff2') format('woff2'), /* Super Modern Browsers */
            url('/font/roboto-v30-latin_cyrillic-ext_cyrillic-700.woff') format('woff'), /* Modern Browsers */
            url('/font/roboto-v30-latin_cyrillic-ext_cyrillic-700.ttf') format('truetype') /* Safari, Android, iOS */
        }

        :root {
            --bg-color: white;
            --keyword-color: #0033B3;
            --name-color: #248F8F;
            --op-color: black;

            --string-color: #067D17;
            --number-color: #1750EB;
            --prop-name-color: #971796;
            --function-color: #A77C43;

            --bracket-color: black;

            --standart-line-height: 1.55em;

            --shift: 1.2em;
        }
        .darkTheme {
            --bg-color: #2B2B2B;
            --keyword-color: #CC7832;

            --name-color: #A7B2BE;
            --op-color: #A7B2BE;

            --string-color: #4E6E4E;
            --number-color: #6195BB;
            --prop-name-color: #726BA7;
            --function-color: #FBC169;

            --bracket-color: #A7B2BE;
        }

        body {
            margin: 0;
            font-family: 'Roboto', sans-serif;
            font-size: 15px;
            background: var(--bg-color);
        }
        #nav {
            color: #2f2f2f;
            font-weight: bold;
            padding: 5px;
            background: rgb(232, 232, 232);
        }

        table {
            border-collapse: collapse;
            border: 1px solid #2B2B2B;
        }
        table td { border: 1px solid #2B2B2B; }

        .pageIDE { display: flex; }
        .popup {
            position: absolute;
            background: #ececec;
            opacity: 0.96;
            z-index: 3;
            box-shadow: rgba(0, 0, 0, 0.15) 0px 2px 8px;
            border: 1px solid #ffffff;
        }

        .pageSign {
            display: flex;
            justify-content: center;
            justify-self: center;
        }
        .signContainer {
            display: flex;
            justify-content: center;
            width: 15em;
            margin-top: 5em;
            padding: 25px;
            background: #dcdde1;
        }

        .signBlock input {
            width: 15em;
        }

        .sidebar {
            height: 100vh;
            min-width: 15em;
            overflow-y: scroll;
            border-right: 1px solid lightgray;
        }

        .nodes {
            background: white;
            padding: 0 7px;
            color: #212121;
        }
        .nodes > .node > .nodeContainer > .openClose { display: none; }

        .mainContainer {
            background: white;
            flex-grow: 1;
            height: 100vh;
            overflow-y: scroll;
        }

        .subFields { margin-left: 12px; }
        .dataUnit { cursor: pointer; }
        .openClose {
            margin-right: 5px;
            color: #656565;
            cursor: pointer;
        }
        .openClose.disabled {
            opacity: 0.15;
        }
        .tabs {
            display: flex;
            min-height: 30px;
            background: #F3F3F3;
            border-top: 1px solid lightgray;
            border-bottom: 1px solid lightgray;
        }
        .tab {
            display: flex;
            justify-content: space-between;
            align-items: center;
            column-gap: 5px;
            padding: 5px 10px;
            cursor: pointer;
        }
        .tab.active { background: #FFFFFF; }
        .tabsContent {
            /*margin: 0 15px;*/
        }
        .tabHeader {
            color: black;
            cursor: pointer;
            padding: 5px 5px;
            background: rgb(236, 236, 236);
            font-weight: bold;
            gap: 5px;
        }
        .tabHeader.active {
            background: white;
            color: black;
        }
        .tabCloseBtn {
            margin-left: 5px;
            width: 0.8em;
            height: 0.8em;
            border-radius: 100px;
            background: rgba(231, 150, 150, 0.99);
        }

        .astEditor {
            font-variant-ligatures : none;
            font-size: 14px;
            font-weight: 600;
            overflow: scroll;
            position: relative;
            overflow: inherit;
        }
        .astContainer {
            background: var(--bg-color);
            padding: 0 0.5em;
        }

        .markedNode {
            padding: 0.5em 0; font-weight: 400;
        }

        .ASTNode {
            display: inline;
            font-family: 'JetBrains Mono', sans-serif;
            font-size: 13px;
            line-height: 1.55em;
        }
        .ASTNode.block { display: block; }

        .ASTNode.if { display: block; }
        .ASTNode.ifBody { display: block; }

        .ASTNode.callableBody {
            display: inline-block;
            margin-left: var(--shift);
        }

        .ASTNode.module { display: block; }
        .ASTNode.moduleImports,
        .ASTNode.moduleCallableCondition {
            display: block;
            border-bottom: 1px solid #eaeaea;
            min-height: 1em;
        }
        .ASTNode.moduleBody { display: block; }
        .ASTNode.import { display: block; }

        .ASTNode.newLine {
            display: block;
            width: 7px;
        }
        .ASTNode.newLine.verticalShift {
            height: var(--standart-line-height);
        }
        .ASTNode.inserter {
            background: #A6D2FF;
            padding: 0 1px;
        }

        div.bracket { color: var(--bracket-color) }

        div.keyword { color: var(--keyword-color); }
        div.id { color: var(--name-color); }
        div.op { color: var(--op-color); }

        div.string { color: var(--string-color); }
        div.number { color: var(--number-color); }
        div.propName { color: var(--prop-name-color); }
        div.function { color: var(--function-color); }

        .console {
            position: fixed;
            width: 100%;
            overflow: scroll;
            bottom: 0;
            z-index: 5;
            background: #b9b9b9;
        }
        .consoleInput { width: 100%; }
        .console pre {
            margin: 0;
            white-space: -moz-pre-wrap; /* Mozilla, supported since 1999 */
            white-space: -pre-wrap; /* Opera */
            white-space: -o-pre-wrap; /* Opera */
            white-space: pre-wrap; /* CSS3 - Text module (Candidate Recommendation) http://www.w3.org/TR/css3-text/#white-space */
            word-wrap: break-word; /* IE 5.5+ */
        }

        .processLogHeader {
            display: flex;
            align-items: center;
            background: #a5a5a5;
            padding: 3px 10px;
        }
        .processLogContent {
            padding: 0 10px;
            background: #f6f6f6;
            height: 180px;
            overflow: scroll;
        }

        [contenteditable] {outline: 0; }

        .shift { margin-left: calc( var(--shift) * 1 ); }
        .shift1 { margin-left: calc( var(--shift) * 1 ); }
        .shift2 { margin-left: calc( var(--shift) * 2 ); }
        .shift3 { margin-left: calc( var(--shift) * 3 ); }
        .shift4 { margin-left: calc( var(--shift) * 4 ); }
        .shift5 { margin-left: calc( var(--shift) * 5 ); }
        .shift6 { margin-left: calc( var(--shift) * 6 ); }
        .shift7 { margin-left: calc( var(--shift) * 7 ); }
        .shift8 { margin-left: calc( var(--shift) * 8 ); }
        .shift9 { margin-left: calc( var(--shift) * 9 ); }
        .shift10 { margin-left: calc( var(--shift) * 10 ); }

        .textareaEditor {
            font-family: 'Roboto', sans-serif;
            font-size: 15px;
            margin-top: 0.5em;
            font-weight: 400;
            width: 100%;
            height: calc(100vh - 50px);
            border: none;
            outline: none;
            resize: none;
        }
        .jsEditor {
            font-family: 'JetBrains Mono', sans-serif;
            line-height: 1.55em;
            font-variant-ligatures : none;
            font-size: 13.7px;
            font-weight: 600;

            width: 100%;
            height: calc(100vh - 54px);
            border: none;
            outline: none;
            resize: none;
        }
        .jsEditor * { font-variant-ligatures : none; }

        .line {
            margin: 0; padding: 0;
            height: 18px;
            line-height: 18px;
            font-size: 14px;
            color: #353535;
        }
        .selectorContainer {
            position: absolute;
        }
        .selector {
            position: absolute;
            background: #A6D2FF;
            z-index: 2;
        }
        .unit a { color: black; }

        input {
            font-family: 'Roboto', sans-serif;
            font-size: 15px;
        }
        input.scriptName {
            border: 1px solid black;
            color: black;
            padding: 3.5px;
            background: rgb(170 191 222);
        }

        .nodeMarked,
        .nodeHighlight {
            background: #A6D2FF;
        }

        .hidden { display: none !important; }
        .visibilityHidden { visibility: hidden; }

        .grid { display: grid; }
        .flex { display: flex; }
        .inlineBlock { display: inline-block; }
        .gap { gap: 10px; }
        .alignCenter { align-items: center; }

        .btn {
            background: #4d6080;
            color: white;
            cursor: pointer;
            padding: 2px 4px;
            text-decoration: none;
            font-weight: normal;
        }
        .btn:hover, .btn.active {
            background: white;
            color: #2B2B2B;
        }
        .btnsBar {
            display: flex;
            align-items: center;
            background: #F3F3F3;
        }
        .rotate180 { transform: rotate(180deg); }
        .key {
            border: 1px solid black;
            padding: 0.2em 0.9em;
        }
        .noselect {
            webkit-touch-callout: none; /* iOS Safari */
            -webkit-user-select: none; /* Safari */
            -khtml-user-select: none; /* Konqueror HTML */
            -moz-user-select: none; /* Old versions of Firefox */
            -ms-user-select: none; /* Internet Explorer/Edge */
            user-select: none; /* Non-prefixed version, currently
                                  supported by Chrome, Edge, Opera and Firefox */
        }
    </style>
</head>
<body>

<div id="app"></div>
${gcaptcha ? '<script src="https://www.google.com/recaptcha/api.js?render=6Ldhj6AfAAAAAMjreOkJLkqN3zgejHQ2AQFA3m_e"></script>' : ''}
<script src="/ace/ace.js"></script>
<script type="module" src="/x.js"></script>
</body>
</html>
`);
}