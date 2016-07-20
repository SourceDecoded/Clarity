"use strict";
var CharacterController = (function () {
    function CharacterController() {
        this.currentState = null;
        this.states = {};
    }
    CharacterController.prototype.getState = function (stateName) {
        return this.states[stateName] || null;
    };
    CharacterController.prototype.addState = function (state) {
        this.states[state.name] = state;
        state.setCharacterController(this);
        if (this.currentState === null) {
            this.currentState = state;
        }
    };
    CharacterController.prototype.removeState = function (stateName) {
        delete this.states[stateName];
    };
    CharacterController.prototype.changeState = function (stateName) {
        var nextState = this.states[stateName];
        if (!nextState) {
            throw new Error("Couldn't find state by name: " + stateName + ".");
        }
        if (this.currentState.name === stateName) {
            return;
        }
        this.currentState.deactivated();
        this.currentState = nextState;
        this.currentState.activated();
    };
    CharacterController.prototype.command = function (methodName, args) {
        if (typeof this.currentState[methodName] === "function") {
            this.currentState[methodName].apply(this.currentState, args || []);
        }
        else {
            throw new Error("Couldn't find command:" + methodName + " on state: " + this.currentState.name + ".");
        }
    };
    CharacterController.prototype.update = function (delta) {
        this.currentState.update(delta);
    };
    CharacterController.prototype.draw = function (context, viewRect) {
        this.currentState.draw(context, viewRect);
    };
    return CharacterController;
}());
module.exports = CharacterController;
//# sourceMappingURL=CharacterController.js.map