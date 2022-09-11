import AstNode from "./AstNode.js";

export default class Op extends AstNode {

    opType;

    constructor(op, options = {}) {
        super('', {...options, className: 'op'});

        this.openSpace = new AstNode('.');
        this.openSpace.visibilityHide();

        this.opType = new AstNode(op, {className: 'opType'});

        this.closeSpace = new AstNode('.');
        this.closeSpace.visibilityHide();

        super.insert(this.openSpace);
        super.insert(this.opType);
        super.insert(this.closeSpace);
    }

    hideSpaces() {
        this.openSpace.hide();
        this.closeSpace.hide();
    }

    iEditTxt() {
        this.opType.iEditTxt();
        this.opType.focus();
    }

    oEditTxt() { this.opType.oEditTxt(); }

    serialize() {
        return {
            ...super.serialize(),
            op: this.opType.getTxt(),
        }
    }

    getTxt() { return this.opType.getTxt(); }

    mark() { this.opType.mark() }
    unmark() { this.opType.unmark() }
}