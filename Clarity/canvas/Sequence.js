var Sequence = (function () {
    function Sequence() {
        this.count = 0;
        this.repeat = false;
        this.steps = [];
    }
    Sequence.prototype.addStep = function (step) {
        this.steps.push(step);
    };
    Sequence.prototype.removeStep = function (step) {
        var index = this.steps.indexOf(step);
        if (index >= 0) {
            this.steps.splice(index, 1);
        }
    };
    Sequence.prototype.step = function (delta) {
        var index = this.count % this.steps.length;
        this.steps[index](delta);
        this.count++;
        return this.count % this.steps.length === 0;
    };
    Sequence.prototype.moveToStep = function (stepIndex) {
        this.count = stepIndex;
    };
    Sequence.prototype.moveToBeginning = function () {
        this.moveToStep(0);
    };
    Sequence.prototype.moveToEnd = function () {
        this.moveToStep(this.steps.length - 1);
    };
    return Sequence;
})();
module.exports = Sequence;
//# sourceMappingURL=Sequence.js.map