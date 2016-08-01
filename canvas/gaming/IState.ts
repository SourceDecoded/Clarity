import IDraw = require("./IDraw");
import IRect = require("../IRect");

interface IState extends IDraw {
    name: string;
    activated(): void;
    deactivated(): void;
    setCharacterController(characterController): void;
    update(viewRect: IRect): void;
}

export = IState;