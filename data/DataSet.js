var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", "../query/Queryable"], function (require, exports, Queryable) {
    var DataSet = (function (_super) {
        __extends(DataSet, _super);
        function DataSet(Type, dataContext) {
            _super.call(this);
            this.Type = Type;
            this.dataContext = dataContext;
            this.provider = dataContext.getQueryProvider(Type);
        }
        DataSet.prototype.add = function (entity) {
            return this.dataContext.addEntity(entity);
        };
        DataSet.prototype.attach = function (entity) {
            return this.dataContext.attachEntity(entity);
        };
        DataSet.prototype.remove = function (entity) {
            return this.dataContext.removeEntity(entity);
        };
        DataSet.prototype.load = function (entity) {
            return this.dataContext.loadEntity(entity);
        };
        DataSet.prototype.createInstance = function () {
            var entity = new this.Type();
            this.dataContext.addEntity(entity);
            return entity;
        };
        return DataSet;
    })(Queryable);
    return DataSet;
});
