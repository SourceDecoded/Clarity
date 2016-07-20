import Queryable = require("../query/Queryable");

class DataSet extends Queryable {
    Type: any;
    provider: any;
    dataContext: any;

    constructor(Type, dataContext) {
        super();
        this.Type = Type;
        this.dataContext = dataContext;
        this.provider = dataContext.getQueryProvider(Type);
    }

    add(entity) {
        return this.dataContext.addEntity(entity);
    }

    attach(entity) {
        return this.dataContext.attachEntity(entity);
    }

    remove(entity) {
        return this.dataContext.removeEntity(entity);
    }

    load(entity) {
        return this.dataContext.loadEntity(entity);
    }

    createInstance() {
        var entity = new this.Type();
        this.dataContext.addEntity(entity);

        return entity;
    }
}

export = DataSet;