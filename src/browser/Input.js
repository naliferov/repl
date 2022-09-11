export default class Input {

    constructor(win) { this.win = win; }

    disableHandlers() {
        this.win.onkeydown = null;
        this.win.onkeyup = null;
        this.win.onclick = null;
        this.win.ondblclick = null;
    }

    onKeyDown(fn) { this.win.onkeydown = fn; }
    onKeyUp(fn) { this.win.onkeyup = fn; }
    onClick(fn) { this.win.onclick = fn; }
    onDblClick(fn) { this.win.ondblclick = fn; }

    onMouseMove(fn) { this.win.onmousemove = fn; }
    onMouseUp(fn) { this.win.onmouseup = fn; }
}