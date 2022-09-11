import AstNode from "../AstNode.js";
import Keyword from "../Keyword.js";

export default class Id extends AstNode {

    constructor(name, options = {}) {
        super('', {...options, className: 'id'});

        this.keyword = new Keyword('');
        super.insert(this.keyword);
        this.keyword.hide();

        this.name = new AstNode(name, {className: 'nameNode'});
        super.insert(this.name);
    }

    /*putSubId(node) {
        if (!this.subId) this.subId = node;
        super.insert(this.subId);
    }*/

    serialize() {
        let data = super.serialize();
        data = {
            ...data,
            name: this.name.getTxt(),
        };
        if (this.subId) data.subId = this.subId.serialize();
        if (this.keyword.isShowed()) data.mode = this.keyword.getTxt();

        return data;
    }

    iEditTxt() {
        this.name.iEditTxt();
        this.name.focus();
    }
    oEditTxt() { this.name.oEditTxt(); }
    getTxt() { return this.name.getTxt(); }

    switchKeyword() {
        if (this.isLet()) {
            this.keyword.setTxt('new'); this.keyword.show();
        } else if (this.isNew()) {
            this.keyword.setTxt('await'); this.keyword.show();
        } else if (this.isAwait()) {
            this.keyword.setTxt(''); this.keyword.hide();
        } else {
            this.keyword.setTxt('let');
            this.keyword.show();
        }
    }

    isLet() { return this.keyword.isShowed() && this.keyword.getTxt() === 'let'; }
    isNew() { return this.keyword.isShowed() && this.keyword.getTxt() === 'new'; }
    isAwait() { return this.keyword.isShowed() && this.keyword.getTxt() === 'await'; }
    enableMode(mode) { this.keyword.setTxt(mode); this.keyword.show(); }
}