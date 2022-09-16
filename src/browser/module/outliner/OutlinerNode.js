import {uuid} from "../../../F.js";
import V from "../../../type/V.js";
import Btn from "../../../type/Btn.js";

export default class OutlinerNode {

    constructor(node, isRoot) {
        this.node = node;

        this.domId = uuid();
        window.outlinerPool.set(this.domId, this);
        this.v = new V({id: this.domId, class: ['node']});

        const container = new V({class: ['nodeContainer', 'flex']});
        e('>', [container, this.v]);

        this.openClose = new V({txt: '>', class: 'openClose'});
        this.openClose.on('click', () => {
            if (this.openClose.hasClass('disabled')) return;
            if (this.nodesV.isHidden()) {
                this.nodesV.show();
                this.node.set('open', true);
            } else {
                this.nodesV.hide();
                this.node.del('open');
            }
            e('nodeChange');
        });
        e('>', [this.openClose, container]);

        this.dataV = new V({class: 'dataUnit', txt: node.get('name')});
        this.dataV.setAttr('outliner_node_id', this.domId);
        this.dataV.toggleEdit();
        e('>', [this.dataV, container]);

        if (!isRoot) {
            const id = new V({txt: 'ID', style: {
                'margin-left': '10px'
            }});
            id.on('click', () => console.log(node.get('id')));
            e('>', [id, container]);
        }

        this.nodesV = new V({class: ['subNodes', 'shift']});
        e('>', [this.nodesV, this.v]);

        const subNodes = this.node.get('nodes');
        this.openClose.addClass('disabled');
        if (subNodes && subNodes.length) {
             this.openClose.removeClass('disabled');
        }
    }
    updateNameInContextNode() { this.getContextNode().set('name', this.dataV.getTxt().trim()) }
    getDomId() { return this.domId }
    isEmpty() { return !this.nodesV.getDOM().children.length }
    isInRoot() { return this.getParent().isRoot }
    markAsRootNode() { this.isRoot = true }
    getParent() { return window.outlinerPool.get(this.v.parentDOM().parentNode.id) }

    next() {
        const next = this.v.getDOM().nextSibling;
        if (!next) return;
        return window.outlinerPool.get(next.id);
    }

    prev() {
        const previous = this.v.getDOM().previousSibling;
        if (!previous) return;
        return window.outlinerPool.get(previous.id);
    }
    getContextNode() { return this.node }
    getV() { return this.v }
    getNodesV() { return this.nodesV}
    removeSubNodesShift() { this.nodesV.removeClass('shift'); }
    focus() { this.dataV.focus(); }
}