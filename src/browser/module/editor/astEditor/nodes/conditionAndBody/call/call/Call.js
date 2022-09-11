import AstNode from "../../../AstNode.js";
import CallCondition from "./CallCondition.js";
import CallConditionPart from "./CallConditionPart.js";

export default class Call extends AstNode {

    constructor(txt = '', options = {}) {
        super('', {...options, className: 'call'});

        super.insert(new AstNode('('));
        this.condition = new CallCondition('', {id: options.conditionId});
        super.insert(this.condition);
        super.insert(new AstNode(')'));
    }

    insertInCondition(node) {
        if (node instanceof CallConditionPart) {
            if (!this.condition.isEmpty() > 0) this.condition.getLastChunk().showSeparator();
            this.condition.insert(node);
        }
    }
    isConditionEmpty() { return this.condition.getChildrenCount() < 1; }
    getCondition() { return this.condition; }
    getFirstConditionPart() { return this.condition.getFirstChunk(); }

    serialize() {
        return {
            ...super.serialize(),
            condition: this.condition.serializeSubNodes(),
            conditionId: this.condition.getId(),
        };
    }

    insert(chunk) { this.condition.insert(chunk); }
}