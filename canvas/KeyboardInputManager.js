var KeyboardInputManager = (function () {
    function KeyboardInputManager(document) {
        this.document = document;
        this.keys = {};
        this.mapping = {};
        this.controllers = [];
    }
    KeyboardInputManager.prototype.registerController = function (controller) {
        this.controllers.push(controller);
    };
    KeyboardInputManager.prototype.onKeyDown = function (event) {
        this.keys[event.keyCode] = true;
    };
    KeyboardInputManager.prototype.onKeyUp = function (event) {
        this.keys[event.keyCode] = false;
    };
    KeyboardInputManager.prototype.start = function () {
        this.keyDownListener = this.onKeyDown.bind(this);
        this.keyUpListener = this.onKeyUp.bind(this);
        this.document.addEventListener("keydown", this.keyDownListener);
        this.document.addEventListener("keyup", this.keyUpListener);
    };
    KeyboardInputManager.prototype.stop = function () {
        var _this = this;
        this.document.removeEventListener("keydown", this.keyDownListener);
        this.document.removeEventListener("keyup", this.keyUpListener);
        Object.keys(this.keys).forEach(function (key) {
            _this.keys[key] = false;
        });
    };
    KeyboardInputManager.prototype.update = function () {
        var keys = this.keys;
        var mapping = this.mapping;
        this.controllers.forEach(function (controller) {
            Object.keys(mapping).forEach(function (command) {
                var isPressed = keys[mapping[command]];
                if (isPressed) {
                    controller.command(command);
                }
                return !isPressed;
            });
        });
    };
    KeyboardInputManager.prototype.addCommand = function (key, command) {
        this.mapping[command] = key;
        this.keys[key] = false;
    };
    return KeyboardInputManager;
})();
module.exports = KeyboardInputManager;
//# sourceMappingURL=KeyboardInputManager.js.map