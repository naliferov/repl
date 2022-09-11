import AstNode from "../../AstNode.js";
import ObjectBody from "./ObjectBody.js";

export default class ObjectNode extends AstNode {

    constructor(txt = '', options = {}) {
        super('', {...options, className: 'object'});

        this.isHorizontal = true;

        let openBracket = new AstNode('{', {className:'bracket'}); super.insert(openBracket);
        this.objectBody = new ObjectBody; super.insert(this.objectBody);
        let closeBracket = new AstNode('}', {className:'bracket'});  super.insert(closeBracket);
    }

    switchMode() {
        this.isHorizontal = !this.isHorizontal;
        if (this.isHorizontal) {
            this.objectBody.displayBlock();
            this.objectBody.addShift();
        } else {
            this.objectBody.displayInline();
            this.objectBody.removeShift();
        }
    }
    getBody() { return this.objectBody; }
    isEmpty() { return this.objectBody.isEmpty(); }

    serialize() {
        return {
            ...super.serialize(),
            body: this.objectBody.serializeSubNodes(),
        }
    }

    insert(chunk) {
        this.objectBody.insert(chunk);
    }
}