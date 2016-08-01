import IState = require("./IState");
import IDraw = require("./IDraw");
import IRect = require("../IRect");
import Rect = require("../Rect");
import View = require("../View");

class CharacterController implements IDraw {
    name: string;
    states: {
        [Key: string]: IState
    };
    currentState: IState;
    view: View;

    constructor() {
        this.currentState = null;
        this.states = {};
    }

    getState(stateName: string) {
        return this.states[stateName] || null;
    }

    addState(state: IState) {
        this.states[state.name] = state;
        state.setCharacterController(this);

        if (this.currentState === null) {
            this.currentState = state;
        }
    }

    removeState(stateName: string) {
        delete this.states[stateName];
    }

    changeState(stateName: string) {
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

    command(methodName: string, args?: any[]) {
        if (typeof this.currentState[methodName] === "function") {
            this.currentState[methodName].apply(this.currentState, args || []);
        } else {
            throw new Error("Couldn't find command:" + methodName + " on state: " + this.currentState.name + ".");
        }
    }

    update(delta) {
        this.currentState.update(delta);
    }

    draw(context: CanvasRenderingContext2D, viewRect: IRect) {
        this.currentState.draw(context, viewRect);
    }
}

export = CharacterController;