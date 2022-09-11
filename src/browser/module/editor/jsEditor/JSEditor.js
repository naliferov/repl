import V from "../../../../type/V.js";

export default class JSEditor {

    constructor(node) {
        let js = node.get('js') ?? '';

        this.v = new V({ class:['jsEditor'], tagName: 'textarea', value: js});
        this.v.on('keyup', (event) => {
            const newValue = event.target.value;
            if (js === newValue) return;
            js = newValue;
            node.set('js', js);
            e('nodeChange');
        });
    }
    show() { this.v.show(); }
    hide() { this.v.hide(); }
    getV() { return this.v; }
    close() { this.v.removeFromDom(); }
}