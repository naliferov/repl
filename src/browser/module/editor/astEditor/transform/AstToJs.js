import Id from "../nodes/id/Id.js";

export default class AstToJs {

    createModuleImports(imports, spacesCount) {

        let s = ''.padStart(spacesCount, ' ');
        let s2 = ''.padStart(spacesCount * 2, ' ');

        let js = s + 'return {\n';
        for (let i = 0; i < imports.length; i++) {
            const {name, path} = imports[i];

            if (name.includes('{')) {
                const nameClear = name.replaceAll('{', '').replaceAll('}', '');
                js += s2 + `${nameClear}: (await import(${path})).${nameClear},\n`;
            } else {
                js += s2 + `${name}: (await import(${path})).default,\n`;
            }
        }
        js += s + '}';
        return js;
    }

    createCallCode(d, spaceCounts) {
        const condition = d.condition;

        let js = ''

        for (let i = 0; i < condition.length; i++) {
            if (!condition[i].internal) throw new Error('invalid data ' + JSON.stringify(condition[i]))
            js += this.createJSFromList(condition[i].internal, spaceCounts, false);
            js += ', ';
        }

        return js;
    }

    createCallableCode(d, spaceCounts) {

        const condition = d.condition;
        const body = d.body;

        let s = ''.padStart(spaceCounts, ' ');
        let js = d.async ? 'async (' : '(';

        for (let i = 0; i < condition.length; i++) {
            if (!condition[i].internal) throw new Error('invalid data ' + JSON.stringify(condition[i]))
            js += this.createJSFromList(condition[i].internal, spaceCounts, false);
            js += ', ';
        }

        js += ') => {\n';

        js += this.createJSFromList(body, spaceCounts + 4);
        js += '\n' + s + '}';

        return js;
    }

    createForCode(d, spaceCounts) {

        const condition = d.condition;
        const body = d.body;

        let s = ''.padStart(spaceCounts, ' ');
        let js = d.async ? 'async for (' : s +'for (';

        for (let i = 0; i < condition.length; i++) {
            if (!condition[i].internal) throw new Error('invalid data ' + JSON.stringify(condition[i]))
            js += this.createJSFromList(condition[i].internal, spaceCounts, false);
            js += ', ';
        }

        js += ') => {\n';

        js += this.createJSFromList(body, spaceCounts + 4);
        js += '\n' + s + '}';

        return js;
    }

    createJSFromList(body, spaceCount, addSpaceFlag = true) {

        let s = '';

        let addSpace = addSpaceFlag;
        let sp = () => {
            if (addSpace) {
                addSpace = false;
                return ''.padStart(spaceCount, ' ');
            }
            return ''
        }

        for (let i = 0; i < body.length; i++) {

            const d = body[i];
            if (d.t === 'Id') {
                let key = '';
                if (d.mode) key = d.mode + ' ';
                s += sp() + key + d.name;
            }
            else if (d.t === 'Op') s += sp() + ' ' + d.op + ' ';
            else if (d.t === 'Literal') s += sp() + d.txt;
            else if (d.t === 'Keyword') s += sp() + d.keyword + ' ';
            else if (d.t === 'NewLine') {
                s += sp() + '\n';
                addSpace = true;
            } else if (d.t === 'SubId') {
                const container = d.container;
                s += '.' + this.createJSFromList(container, spaceCount, false);
            } else if (d.t === 'If') {

                s += sp() + 'if (' + this.createJSFromList(d.condition) + ') {\n';
                s += this.createJSFromList(d.body, spaceCount + 4);

                addSpace = true;
                s += '\n' + sp() + '} \n';
                addSpace = true;
            }
            else if (d.t === 'Call') s += '(' + this.createCallCode(d, spaceCount) + ')';
            else if (d.t === 'Callable') s += this.createCallableCode(d, spaceCount);
            else if (d.t === 'For') s += this.createForCode(d, spaceCount);
            else console.log('Unknown astNode type', d);
        }

        return s;
    }

    createJavascriptCodeForFile(AST) {

        const imports = AST.imports;

        const js = [];
        js.push('let x = {}');
        js.push("x['main.imports'] = async () => {");
            js.push(this.createModuleImports(imports, 4));
        js.push("}");

        js.push("x['main'] = async () => {");

        let importNames = [];
        for (let i = 0; i < imports.length; i++) {
            const name = imports[i].name.replaceAll('{', '').replaceAll('}', '');
            importNames.push(name);
        }
        js.push(`let {${importNames.join(', ')}} = await x['main.imports']();`);

        js.push(this.createJSFromList(AST.body, 4));
        js.push("}");

        js.push("\n");
        js.push("(async() => { await x['main']() })()");

        return js;
    }

    createJsCode(node, AST) {
        const js = this.createJavascriptCodeForFile(AST);
        return js.join('\n');
    }
}