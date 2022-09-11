import AstNode from "./AstNode.js";

export default class NewLine extends AstNode {

    constructor(txt = '', options = {}) {
        super('', {...options, className: 'newLine'});
        this.newLine();
    }

    isVerticalShifted() { return this.v.hasClass('verticalShift'); }
    addVerticalShift() { this.v.addClass('verticalShift'); }
    removeVerticalShift() { this.v.removeClass('verticalShift'); }
}