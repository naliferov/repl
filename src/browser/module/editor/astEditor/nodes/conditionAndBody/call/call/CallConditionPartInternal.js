import AstNode from "../../../AstNode.js";

export default class CallConditionPartInternal extends AstNode {

    constructor() {
        super('', {className: 'callConditionPartInternal'});

        /*this.internal = new CallableConditionPartInternal;
        super.insert(this.internal);
        let closePart = new AstNode(', ');
        super.insert(closePart);*/
    }

    //getInternal() { return this.internal; }
    /*serialize(): object {
        return {
            t: this.constructor.name,
            internal: this.internal.serializeSubNodes(),
        };
    }*/

    //getLastChunk() { return this.internal.getLastChunk(); }
    //insert(chunk: AstNode) { this.internal.insert(chunk); }
}