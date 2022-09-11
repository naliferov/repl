import {uuid} from "../../../../../F.js";
import V from "../../../../../type/V.js";

export default class AstNode {

    constructor(txt = '', options = {}) {
        this.id = options.id ?? uuid();

        let classArr = ['ASTNode'];
        if (options.className && Array.isArray(options.className)) {
            classArr = [...options.className, ...classArr];
        } else if (options.className) {
            classArr.push(options.className);
        }

        this.v = new V({
            id: this.id,
            tagName: options.tagName ? options.tagName: 'div',
            class: classArr,
            txt,
        });
        if (options.hidden) this.v.hide();

        window.astPool.set(this.id, this);
    }

    getId() { return this.id; }
    getName() { return this.constructor.name; }
    getDOM() {return this.v.getDOM(); }

    serialize() {
        return {
            id: this.getId(),
            t: this.constructor.name,
        }
    }

    serializeSubNodes() {
        const subChildren = this.v.getDOM().children;
        const subNodes = [];

        for (let i = 0; i < subChildren.length; i++) {

            const astNode = window.astPool.get(subChildren[i].id);
            if (astNode.constructor.name === 'Inserter') continue;
            let astNodeSerialized = astNode.serialize();

            subNodes.push(astNodeSerialized);
        }

        return subNodes;
    }

    isEmpty() { return this.v.getDOM().children.length === 0; }
    in(node) { this.insert(node) }
    insert(node) { e('>', [node.getV(), this.v]); }

    insertBefore(chunk, beforeChunk) {
        //console.log('insertBefore', chunk, beforeChunk);
        //this.v.insertBefore(chunk.getV(), beforeChunk.getUnit());
    }

    getParentChunk() { return window.astPool.get(this.v.getDOM().parentNode.id); }
    getParentNode() { return this.getParentChunk(); }

    getFirstChunk() {
        const first = this.v.getDOM().firstChild;
        if (!first) return;
        return window.astPool.get(first.id);
    }

    getLastChunk() {
        const last = this.v.getDOM().lastChild
        if (!last) return;
        return window.astPool.get(last.id);
    }

    getNextChunk() {
        const next = this.v.getDOM().nextSibling;
        if (!next) return;
        return window.astPool.get(next.id);
    }

    getPrevChunk() {
        const prev = this.v.getDOM().previousSibling;
        if (!prev) return;
        return window.astPool.get(prev.id);
    }

    getChildrenCount() { return this.v.getDOM().children.length }
    getChildren() { return this.v.getDOM().children }

    getV() { return this.v }
    newLine() { this.v.removeClass('inline') }
    mark() { this.v.addClass('nodeMarked') }
    unmark() { this.v.removeClass('nodeMarked') }
    show() { this.v.show() }
    hide() { this.v.hide() }
    isShowed() { return this.v.isShowed() }
    remove() { this.v.removeFromDom() }
    getTxt() { return this.v.getTxt(); }
    setTxt(txt) { this.v.setTxt(txt); }
    iEditTxt() { this.v.iEditMod(); }
    oEditTxt() { this.v.oEditMode(); }
    toggleEditTxt() { this.v.toggleEdit(); }
    focus() { this.v.focus(); }
    toggleDisplay() { this.v.toggleDisplay() }
    clear() { this.v.clear(); }

    iKeydownEnable(fn) { this.v.on('keydown', fn); }
    iKeydownDisable(fn) { this.v.off('keydown', fn); }
    iKeyupEnable(fn) { this.v.on('keyup', fn); }
    iKeyupDisable(fn) { this.v.off('keyup', fn); }
    visibilityHide() { this.v.visibilityHide(); }

    addShift() { this.v.addClass('shift'); }
    removeShift() { this.v.removeClass('shift'); }
    displayBlock() { this.v.addClass('block');}
    displayInline() { this.v.removeClass('block');}

    isShifted() { return this.v.hasClass('shift'); }
    findInPool(id) { return window.astPool.get(id); }

    highlight() { this.v.addClass('nodeHighlight'); }
    unHighlight() { this.v.removeClass('nodeHighlight'); }

    getElementClassList() { return this.v.getDOM().classList; }
}