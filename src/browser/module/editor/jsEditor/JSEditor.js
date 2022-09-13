import V from "../../../../type/V.js";
import HttpClient from "../../../../io/http/HttpClient.js";

export default class JSEditor {

    constructor(node) {
        this.node = node;
        this.v = new V({ class:['jsEditor'], id: this.getEditorId()});
    }
    getEditorId() { return 'editor_' + this.node.get('id'); }
    applyAceEditor() {
        const editor = ace.edit(this.getEditorId());

        editor.getSession().on('change', async () => {
            const node = this.node;
            const js = editor.getSession().getValue();
            if (node.get('js') === js) return;

            node.set('js', js);
            await new HttpClient().post(e('loopServiceUrl') + '/setKey', {nodeId: node.get('id'), k: 'js', v: js});
        });
        ace.config.set("basePath", "/ace");

        editor.setValue(this.node.get('js'));
        editor.getSession().selection.clearSelection();

        editor.setTheme("ace/theme/kuroir");
        editor.session.setMode("ace/mode/javascript");
    }

    show() { this.v.show(); }
    hide() { this.v.hide(); }
    getV() { return this.v; }
    close() { this.v.removeFromDom(); }
}