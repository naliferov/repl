import List from "./src/browser/List.js";

let strToParse = `

let a = 0;
if (a == 0) {
    a++;
    console.log(a);
}

a = 10;

`


let parse = (s) => {

    let tk = [];

    let entity = '';
    const pushEntity = () => {
        if (entity) {
            tk.push(entity);
            entity = '';
        }
    }

    let opened = new List;
    const separatorChars = {'\n':1, ' ':1, ';':1, '(':1, ')':1, '{':1, '}':1};

    for (let i = 0; i < s.length; i++) {
        const c = s[i];

        if (c === ';') {
            pushEntity(); tk.push(c);
        } else if (c === '(') {
            pushEntity(); tk.push(c);
            //opened.add(c);
        } else if (c === ')') {
            pushEntity(); tk.push(c);
            //if (opened.getLength() > 0) { opened.pop(); } //else console.log('parse error');
        } else if (c === '{') {
            pushEntity(); tk.push(c);
        } else if (c === '}') {
            pushEntity(); tk.push(c);
        } else if (c === '\n') {
            pushEntity();
        } else if (c === ' ') {
            pushEntity();
        } else {
            entity+= c;
        }

        //console.log(s[i]);
    }

    return tk;
}

console.log(parse(strToParse));