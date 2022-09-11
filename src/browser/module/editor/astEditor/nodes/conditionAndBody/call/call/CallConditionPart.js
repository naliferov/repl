import AstNode from "../../../AstNode.js";
import CallConditionPartInternal from "./CallConditionPartInternal.js";

export default class CallConditionPart extends AstNode {

    constructor(txt = '', options = {}) {
        super('', {...options, className: 'callConditionPart'});

        this.internal = new CallConditionPartInternal; super.insert(this.internal);

        this.separator = new AstNode(', ');
        super.insert(this.separator);
        this.separator.hide();
    }
    showSeparator() { this.separator.show(); }
    hideSeparator() { this.separator.hide(); }

    getInternal() { return this.internal; }
    serialize() {
        return {
            ...super.serialize(),
            internal: this.internal.serializeSubNodes(),
        };
    }

    getLastChunk() { return this.internal.getLastChunk(); }
    insert(chunk) { this.internal.insert(chunk); }
}