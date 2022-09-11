import TabName from "./TabName.js";

export default class Tab {

    constructor(tabName, contextNode, editor) {
        this.tabName = new TabName(tabName, contextNode);
        this.contextNode = contextNode;
        this.editor = editor;
    }

    getContextNodeId() { return this.contextNode.get('id'); }
    getContextNode() { return this.contextNode; }
    getTabName() { return this.tabName; }
    getEditor() { return this.editor; }

    activate() {
        this.tabName.activate();
        this.editor.show();
    }
    deactivate() {
        this.tabName.deactivate();
        this.editor.hide();
    }
    onClick(fn) { this.tabName.onTabClick(fn); }
    onClickClose(fn) { this.tabName.onTabCloseClick(fn); }
    close() {
        this.tabName.close();
        this.editor.close();
    }
}