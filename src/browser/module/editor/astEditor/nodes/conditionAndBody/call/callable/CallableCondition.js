import ConditionNode from "../../ConditionNode.js";

export default class CallableCondition extends ConditionNode {
    constructor(txt = '', options = {}) {
        super('', { ...options, className: ['callableCondition']});
    }

    mark() {
        super.mark();
        if (this.isEmpty()) this.getParentNode().highlightConditionBrackets();
    }

    unmark() {
        super.unmark();
        this.getParentNode().unhighlightConditionBrackets();
    }
}