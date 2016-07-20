var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", "./ArrayVisitor"], function (require, exports, ArrayVisitor) {
    var IndexedDbVisitor = (function (_super) {
        __extends(IndexedDbVisitor, _super);
        function IndexedDbVisitor() {
            _super.apply(this, arguments);
        }
        return IndexedDbVisitor;
    })(ArrayVisitor);
    return IndexedDbVisitor;
});
