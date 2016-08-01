"use strict";
var ODataAnnotation = require("./ODataAnnotation");
var Hashmap = require("../collections/Hashmap");
module.exports = {
    createNamespaceToTypeHashmap: function (edm) {
        var models = edm.getModels();
        var hashmap = new Hashmap();
        models.getValues().forEach(function (model) {
            var annotations = model.type.annotations;
            if (Array.isArray(annotations)) {
                annotations.filter(function (annotation) {
                    return annotation instanceof ODataAnnotation;
                }).forEach(function (annotation) {
                    if (typeof annotation.namespace === "string") {
                        hashmap.add(annotation.namespace, model.type);
                    }
                });
            }
        });
        return hashmap;
    },
    createTypeToNamespaceHashmap: function (edm) {
        var models = edm.getModels();
        var hashmap = new Hashmap();
        models.getValues().forEach(function (model) {
            var annotations = model.type.annotations;
            if (Array.isArray(annotations)) {
                annotations.filter(function (annotation) {
                    return annotation instanceof ODataAnnotation;
                }).forEach(function (annotation) {
                    if (typeof annotation.namespace === "string") {
                        hashmap.add(model.type, annotation.namespace);
                    }
                });
            }
        });
        return hashmap;
    }
};
//# sourceMappingURL=util.js.map