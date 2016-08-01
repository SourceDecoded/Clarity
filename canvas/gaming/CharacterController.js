"use strict";
class CharacterController {
    constructor() {
        this.currentState = null;
        this.states = {};
    }
    getState(stateName) {
        return this.states[stateName] || null;
    }
    addState(state) {
        this.states[state.name] = state;
        state.setCharacterController(this);
        if (this.currentState === null) {
            this.currentState = state;
        }
    }
    removeState(stateName) {
        delete this.states[stateName];
    }
    changeState(stateName) {
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
    }
    command(methodName, args) {
        if (typeof this.currentState[methodName] === "function") {
            this.currentState[methodName].apply(this.currentState, args || []);
        }
        else {
            throw new Error("Couldn't find command:" + methodName + " on state: " + this.currentState.name + ".");
        }
    }
    update(delta) {
        this.currentState.update(delta);
    }
    draw(context, viewRect) {
        this.currentState.draw(context, viewRect);
    }
}
module.exports = CharacterController;
//# sourceMappingURL=CharacterController.js.map