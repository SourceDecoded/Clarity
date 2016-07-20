import IUserInputManager = require("./IUserInputManager");
import CharacterController = require("./CharacterController");

class KeyboardInputManager implements IUserInputManager {
    private document;
    private keys;
    private controllers: CharacterController[];
    private keyDownListener;
    private keyUpListener;
    private mapping;

    constructor(document) {
        this.document = document;
        this.keys = {};
        this.mapping = {};
        this.controllers = [];
    }

    registerController(controller: CharacterController) {
        this.controllers.push(controller);
    }

    onKeyDown(event) {
        this.keys[event.keyCode] = true;
    }

    onKeyUp(event) {
        this.keys[event.keyCode] = false;
    }

    start() {
        this.keyDownListener = this.onKeyDown.bind(this);
        this.keyUpListener = this.onKeyUp.bind(this);

        this.document.addEventListener("keydown", this.keyDownListener);
        this.document.addEventListener("keyup", this.keyUpListener);
    }

    stop() {
        this.document.removeEventListener("keydown", this.keyDownListener);
        this.document.removeEventListener("keyup", this.keyUpListener);

        Object.keys(this.keys).forEach((key) => {
            this.keys[key] = false;
        });
    }

    update() {
        var keys = this.keys;
        var mapping = this.mapping;

        this.controllers.forEach((controller) => {
            Object.keys(mapping).forEach((command) => {
                var isPressed = keys[mapping[command]];

                if (isPressed) {
                    controller.command(command);
                }

                return !isPressed;
            });
        });
    }

    addCommand(key: number, command: string) {
        this.mapping[command] = key;
        this.keys[key] = false;
    }
}

export = KeyboardInputManager;