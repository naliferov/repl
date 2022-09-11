import AstNode from "../AstNode.js";
import SubIdContainer from "./SubIdContainer.js";

export default class SubId extends AstNode {

    constructor(txt = '', options = {}) {
        super('', {...options, className: 'subId'});

        this.expressionMod = false;

        this.openBracket = new AstNode('[', {className: 'bracket'});
        if (!this.expressionMod) this.openBracket.hide();
        super.insert(this.openBracket);

        const dot = new AstNode('.', 'className', 'dot');
        if (this.expressionMod) dot.hide();
        super.insert(dot);

        this.container = new SubIdContainer;
        super.insert(this.container);

        const closeBracket = new AstNode(']', {className: 'bracket'});
        if (!this.expressionMod) closeBracket.hide();
        super.insert(closeBracket);
    }

    getFirstContainerNode() { return this.container.getFirstChunk(); }

    switchMode() {
        this.expressionMod = !this.expressionMod;
        if (this.expressionMod) {
            //todo
        }
    }

    serialize() {
        let d = super.serialize();
        d.container = this.container.serializeSubNodes();
        d.expressionMod = this.expressionMod;
        return d;
    }

    insert(chunk) { this.container.insert(chunk); }
}