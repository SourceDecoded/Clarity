import KernelPackage = require("./Kernel");

export = (types: any[]) => {
    return (target) => {
        if (typeof target === "function") {
            target.dependencies = types;
        }
    }
};