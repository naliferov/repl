import V from "../../../../type/V.js";
import HttpClient from "../../../../io/http/HttpClient.js";

export default class ConsolePanel {

    constructor(input, localState) {
        this.v = new V({class: 'processLog'});
        this.header = new V({class: 'processLogHeader'});
        e('>', [this.header, this.v]);

        e('>', [new V({txt: 'Logs'}), this.header]);

        this.automaticScroll = new V({tagName: 'input', style: {marginLeft: '1.5em'}});
        this.automaticScroll.setAttr('type', 'checkbox');

        e('>', [this.automaticScroll, this.header]);
        e('>', [new V({txt: 'automatic scroll'}), this.header]);

        const inputJS = new V({tagName: 'input'});
        e('>', [inputJS, this.v]);
        inputJS.on('keyup', (e) => {
            if (e.key !== 'Enter') return;
            const js = inputJS.getVal();
            if (js.length < 3) return;

            (new HttpClient).post(window.e('loopServiceUrl') + '/console', {js});
        });

        this.content = new V({class: 'processLogContent'});
        e('>', [this.content, this.v]);

        const height = localState.getLogPanelHeight();
        if (height && height < window.innerHeight) {
            this.content.setStyles({height: height + 'px'});
        } else {
            this.content.setStyles({height: '100px'});
            localState.setLogPanelHeight(100);
        }

        this.input = input;
        this.localState = localState;

        this.dragAndDrop();
        this.localState.getLogPanelFlag() ? this.show() : this.hide();
    }

    dragAndDrop() {

        let sizes;
        let shift;

        const mouseMove = (e) => {
            let mouseY = e.clientY;
            if (mouseY < sizes.height) {
                this.content.setStyles({height: window.innerHeight - sizes.height + 'px'});
                return;
            }

            const contentHeight = window.innerHeight - mouseY - (sizes.height - shift);
            this.content.setStyles({height: contentHeight + 'px'});
        }

        this.header.on('mousedown', (e) => {
            e.preventDefault();
            sizes = this.header.getSizes();
            shift = e.clientY - sizes.y;

            this.input.onMouseMove(mouseMove);
            this.input.onMouseUp((e) => {
                this.localState.setLogPanelHeight(this.content.getSizes().height);

                this.input.onMouseUp(null);
                this.input.onMouseMove(null)
            });
        });
    }

    getV() { return this.v; }
    show() { this.v.show(); }
    hide() { this.v.hide(); }
    switchVisibility() {
        if (this.v.isShowed()) {
            this.v.hide();
            //this.localState.setLogPanelFlag(false);
        } else {
            this.v.show();
            //this.localState.setLogPanelFlag(true);
        }
    }

    enableAutomaticScroll() { this.automaticScroll.setAttr('checked', ''); }
}