export default class ShiftHelper {

    constructor() {
        this.level = 0;
        this.addShiftFlag = false;
    }
    levelIncr() { this.level++; }

    handleShift(node) {
        if (!this.addShiftFlag) return;
        node.addShift();
    }
}