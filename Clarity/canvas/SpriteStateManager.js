define(["require", "exports", "./Rect"], function (require, exports, Rect) {
    var SpriteStateManager = (function () {
        function SpriteStateManager() {
            this.currentState = null;
            this.states = {};
            this.sequences = [];
        }
        SpriteStateManager.prototype.addState = function (state) {
            this.states[state.name] = state;
        };
        SpriteStateManager.prototype.removeState = function (stateName) {
            delete this.states[stateName];
        };
        SpriteStateManager.prototype.changeState = function (stateName) {
            var nextState = this.states[stateName];
            if (!nextState) {
                throw new Error("Couldn't find state by name: " + stateName + ".");
            }
        };
        SpriteStateManager.prototype.draw = function (context, viewRect) {
            var intersection = Rect.getIntersection(this.view, viewRect);
            if (intersection && this.rigidBody) {
                this.drawBackground(context, viewRect, intersection);
            }
        };
        return SpriteStateManager;
    })();
});
