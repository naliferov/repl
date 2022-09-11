import AstNode from "../../../AstNode.js";
import NewLine from "../../../NewLine.js";
import Space from "../../../Space.js";
import CallableCondition from "./CallableCondition.js";
import CallableBody from "./CallableBody.js";
import ConditionAndBodyNode from "../../ConditionAndBodyNode.js";
import Keyword from "../../../Keyword.js";

export default class Callable extends ConditionAndBodyNode {

    constructor(txt = '', options = {}) {
        super('', {...options, className: 'callable'});

        this.async = new Keyword('async');
        this.async.hide();
        super.insert(this.async);

        this.openBracket = new AstNode('('); super.insert(this.openBracket);
        this.condition = new CallableCondition('', {id: options.conditionId}); super.insert(this.condition);
        this.closeBracket = new AstNode(')');  super.insert(this.closeBracket);

        super.insert(new Space);
        let arrow = new AstNode('=>');  super.insert(arrow);
        super.insert(new Space);

        super.insert(new AstNode('{'));
        super.insert(new NewLine);
        this.body = new CallableBody('', {id: options.bodyId}); super.insert(this.body);
        super.insert(new NewLine);
        super.insert(new AstNode('}'));
    }

    highlightConditionBrackets() {
        this.openBracket.mark();
        this.closeBracket.mark();
    }

    unhighlightConditionBrackets() {
        this.openBracket.unmark();
        this.closeBracket.unmark();
    }

    switchKeyword() { this.async.toggleDisplay(); }
    isAsync() { return this.async.isShowed(); }
    switchToAsync() { this.async.show(); }
}