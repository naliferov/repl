import AstNode from "../AstNode.js";
import CallableConditionPart from "./call/callable/CallableConditionPart.js";

export default class ConditionAndBodyNode extends AstNode {

    getFirstChunk() { return this.condition; }
    insertInCondition(node) {

        if (node instanceof CallableConditionPart) {
            if (!this.condition.isEmpty() > 0) this.condition.getLastChunk().showSeparator();
        }
        this.condition.insert(node);
    }
    insertInBody(chunk) { this.body.insert(chunk); }

    isConditionEmpty() { return this.condition.getChildrenCount() < 1; }
    isBodyEmpty() { return this.body.getChildrenCount() < 1; }

    getCondition() { return this.condition; }
    getBody() { return this.body; }

    serialize() {
        const data = {
            ...super.serialize(),

            conditionId: this.condition.getId(),
            bodyId: this.body.getId(),

            condition: this.condition.serializeSubNodes(),
            body: this.body.serializeSubNodes(),
        };
        if (this.isAsync && this.isAsync()) data.async = true;
        return data;
    }
}