class Guid {
    private static S4() {
        return Math.floor(
            Math.random() * 0x10000 /* 65536 */
            ).toString(16);
    }
    public static create() {
        return (
            Guid.S4() + Guid.S4() + "-" +
            Guid.S4() + "-" +
            Guid.S4() + "-" +
            Guid.S4() + "-" +
            Guid.S4() + Guid.S4() + Guid.S4()
            );
    }
}

export = Guid;