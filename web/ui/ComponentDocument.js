"use strict";
var emptyFn = function () { };
var setUp = function (HTMLElement, Node) {
    HTMLElement.prototype.matches = HTMLElement.prototype.msMatchesSelector || HTMLElement.prototype.matches;
    HTMLElement.prototype.css = css;
    Node.prototype.appendChildComponent = Node.prototype.appendChild;
    Node.prototype.removeChildComponent = Node.prototype.removeChild;
    Node.prototype.insertBeforeComponent = Node.prototype.insertBefore;
    Node.prototype.replaceChildComponent = Node.prototype.replaceChild;
    Node.prototype.querySelectorComponent = HTMLElement.prototype.querySelector;
    Node.prototype.querySelectorAllComponents = HTMLElement.prototype.querySelectorAll;
    Node.prototype.dispose = dispose;
};
function walkTheElement(element, action) {
    var children = element.childNodes;
    var childrenValues = [];
    for (var x = 0; x < children.length; x++) {
        childrenValues.push(walkTheElement(children.item(x), action));
    }
    return action(element, childrenValues);
}
function convertNodeListToArray(nodeList) {
    var array = [];
    for (var x = 0; x < nodeList.length; x++) {
        array.push(nodeList.item(x));
    }
    return array;
}
function firstComponent() {
    return this._selectorContainers[0].firstChild;
}
function lastComponent() {
    return this._selectorContainers[this._selectorContainers.length - 1].lastChild;
}
function childComponents() {
    var items = this._selectorContainers.reduce(function (items, container) {
        var containerChildren = container.childNodes;
        for (var x = 0; x < containerChildren.length; x++) {
            items.push(containerChildren.item(x));
        }
        return items;
    }, []);
    return {
        item: function (index) {
            return items[index];
        }, length: items.length
    };
}
function childNodes() {
    return this.children;
}
function previousSiblingComponent() {
    var previousSibling = null;
    var parentNode = this.parentNode;
    var element = this;
    if (parentNode) {
        var children = convertNodeListToArray(parentNode.children);
        children.some(function (child, index) {
            if (child === element) {
                previousSibling = children[index - 1] || null;
                return true;
            }
            else {
                return false;
            }
        });
    }
    return previousSibling;
}
function nextSiblingComponent() {
    var nextSibling = null;
    var parentNode = this.parentNode;
    var element = this;
    if (parentNode) {
        var children = convertNodeListToArray(parentNode.children);
        children.some(function (child, index) {
            if (child === element) {
                nextSibling = children[index + 1] || null;
                return true;
            }
            else {
                return false;
            }
        });
    }
    return nextSibling;
}
function appendChildComponent(newChild) {
    var self = this;
    var selectorContainers = this._selectorContainers;
    var didAppend = selectorContainers.some(function (container) {
        var selector = container.getAttribute("select");
        if (selector === "") {
            container.appendChildComponent(newChild);
            return true;
        }
        else if (newChild.nodeType === newChild.ELEMENT_NODE && newChild.matches(selector)) {
            container.appendChildComponent(newChild);
            return true;
        }
        else if (newChild.nodeType === newChild.TEXT_NODE) {
            return true;
        }
        else {
            return false;
        }
    });
    if (!didAppend) {
        throw new Error("Failed to execute 'appendComponent'.");
    }
    return newChild;
}
function removeChildComponent(oldChild) {
    var self = this;
    var selectorContainers = this._selectorContainers;
    var didRemove = selectorContainers.some(function (container) {
        try {
            container.removeChildComponent(oldChild);
            return true;
        }
        catch (e) {
            return false;
        }
    });
    if (!didRemove) {
        throw new Error("Failed to execute 'removeChild'.");
    }
    return oldChild;
}
function insertBeforeComponent(newChild, referenceChild) {
    var self = this;
    var selectorContainers = this._selectorContainers;
    var didInsert = selectorContainers.some(function (container) {
        var selector = container.getAttribute("select");
        if (selector === "") {
            container.insertBeforeComponent(newChild, referenceChild);
            return true;
        }
        else if (!newChild.matches(selector)) {
            return false;
        }
        try {
            container.insertBeforeComponent(newChild, referenceChild);
            return true;
        }
        catch (e) {
            return false;
        }
    });
    if (!didInsert) {
        throw new Error("Failed to execute 'insertBefore'.");
    }
    return newChild;
}
function replaceChildComponent(newChild, referenceChild) {
    var self = this;
    var selectorContainers = this._selectorContainers;
    var didInsert = selectorContainers.some(function (container) {
        var selector = container.getAttribute("select");
        if (selector === "") {
            container.replaceChildComponent(newChild, referenceChild);
            return true;
        }
        else if (!newChild.matches(selector)) {
            return false;
        }
        try {
            container.replaceChildComponent(newChild, referenceChild);
            return true;
        }
        catch (e) {
            return false;
        }
    });
    if (!didInsert) {
        throw new Error("Failed to execute 'replaceChild'.");
    }
    return newChild;
}
function querySelectorComponent(selector) {
    var element = null;
    this._selectorContainers.some(function (container) {
        element = container.querySelector(selector);
        if (element) {
            return true;
        }
        else {
            return false;
        }
    });
    return element;
}
function querySelectorAllComponents(selector) {
    var items = this._selectorContainers.reduce(function (items, container) {
        var containerChildren = container.querySelectorAll(selector);
        for (var x = 0; x < containerChildren.length; x++) {
            items.push(containerChildren.item(x));
        }
        return items;
    }, []);
    return { item: function (index) { return items[index]; }, length: items.length };
}
function dispose() {
    var element = this;
    var children = element.children;
    var child;
    for (var x = 0; x < children.length; x++) {
        var child = children.item(x);
        child.dispose();
    }
    element.controller = null;
}
function css(styles) {
    var element = this;
    requestAnimationFrame(function () {
        Object.keys(styles).forEach(function (key) {
            element.style[key] = styles[key];
        });
    });
}
class ComponentDocument {
    constructor(document, services, htmlParser, HTMLElement = window.HTMLElement, Node = window.Node) {
        var self = this;
        setUp(HTMLElement, Node);
        this._styles = "";
        this._htmlParser = htmlParser;
        this._components = {};
        this._services = services || {};
        this._document = document;
        this._head = document.querySelector("head");
        if (!this._head) {
            throw new Error("Components cannot run without a head element.");
        }
        if (!this._document) {
            throw new Error("Components cannot run without a document.");
        }
        var oldCreateElement = document.createElement;
        // We need to override the default implementation of this function, so we can 
        // use this as the mechanism to create components too.
        document.createElement = function (name) {
            name = name.toLowerCase();
            var component = self._components[name];
            var element = oldCreateElement.call(document, name);
            var attribute;
            if (typeof component === "undefined") {
                self._applyElementFunctions(element);
            }
            else {
                var attributes = component.attributes;
                for (var y = 0; y < attributes.length; y++) {
                    attribute = attributes.item(y);
                    element.setAttribute(attribute.name, attribute.value);
                }
                var children = component.element.childNodes;
                for (var x = 0; x < children.length; x++) {
                    element.appendChild(self._buildComponent(children.item(x)));
                }
                var tags = self._getTags(element);
                self._applyComponentFunctions(element);
                self._applyFunctionsToElement(element);
                self._applyAttributesToComponent(element);
                self._initializeController(component.Controller, element, tags);
            }
            return element;
        };
        document.createComponent = document.createElement;
    }
    _getTags(element) {
        var self = this;
        var tags = convertNodeListToArray(element.querySelectorAll("[tag]"));
        return tags.reduce(function (tags, taggedElement) {
            tags[taggedElement.getAttribute("tag")] = taggedElement;
            return tags;
        }, {});
    }
    _applyElementFunctions(element) {
        Object.defineProperties(element, {
            previousSiblingComponent: {
                configurable: true,
                get: function () {
                    return this.previousSibling;
                }
            },
            nextSiblingComponent: {
                configurable: true,
                get: function () {
                    return this.nextSibling;
                }
            },
            lastChildComponent: {
                configurable: true,
                get: function () {
                    return this.lastChild;
                }
            },
            firstChildComponent: {
                configurable: true,
                get: function () {
                    return this.firstChild;
                }
            },
            childComponents: {
                configurable: true,
                get: function () {
                    return this.childNodes;
                }
            }
        });
        element.dispose = dispose;
    }
    ;
    _attributeNameToJavascriptName(attributeName) {
        var parts = attributeName.split("-");
        return parts.reduce(function (name, part, index) {
            if (index > 0) {
                name += part.substring(0, 1).toUpperCase() + part.substring(1);
            }
            else {
                name = part;
            }
            return name;
        }, "");
    }
    ;
    _applyAttributesToComponent(element) {
        var attributes = element.attributes;
        for (var x = 0; x < element.attributes.length; x++) {
            var domAttribute = element.attributes.item(x);
            var name = domAttribute.name;
            var descriptor = Object.getOwnPropertyDescriptor(element, name);
            if (descriptor) {
                element[name] = domAttribute.value;
            }
        }
    }
    ;
    _applyComponentFunctions(element) {
        var self = this;
        var selectorContainers = convertNodeListToArray(element.querySelectorAll("[select]"));
        element._selectorContainers = selectorContainers;
        if (selectorContainers.length > 0) {
            Object.defineProperties(element, {
                firstComponent: {
                    configurable: true,
                    get: firstComponent
                },
                lastComponent: {
                    configurable: true,
                    get: lastComponent
                },
                childComponents: {
                    configurable: true,
                    get: childComponents
                },
                previousSiblingComponent: {
                    configurable: true,
                    get: previousSiblingComponent
                },
                nextSiblingComponent: {
                    configurable: true,
                    get: nextSiblingComponent
                }
            });
            element.appendChildComponent = appendChildComponent;
            element.removeChildComponent = removeChildComponent;
            element.insertBeforeComponent = insertBeforeComponent;
            element.replaceChildComponent = replaceChildComponent;
            element.querySelectorComponent = querySelectorComponent;
            element.querySelectorAllComponents = querySelectorAllComponents;
        }
        else if (element.getAttribute("select") === null) {
            // We don't want to allow adding children if the developers don't want it.
            element.appendChildComponent = emptyFn;
            element.removeChildComponent = emptyFn;
            element.insertBeforeComponent = emptyFn;
            element.replaceChildComponent = emptyFn;
        }
    }
    ;
    _applyFunctionsToElement(element) {
        var self = this;
        element.dispose = dispose;
        element.css = css;
    }
    ;
    _initializeController(Controller, element, tags) {
        var self = this;
        var controllerNamespace = element.getAttribute("controller");
        if (typeof Controller === "function") {
            element.controller = new Controller(element, tags, self._services);
        }
        else {
            element.controller = null;
        }
    }
    ;
    _removeStyles(htmlElement) {
        var self = this;
        var styles = convertNodeListToArray(htmlElement.querySelectorAll("style"));
        return styles.map(function (style) {
            style.parentElement.removeChild(style);
            return style.innerHTML;
        }).join("\n\n");
    }
    ;
    _registerComponent(htmlElement, Controller) {
        if (htmlElement.nodeType === htmlElement.ELEMENT_NODE) {
            var self = this;
            var styles = self._removeStyles(htmlElement);
            self._styles += styles;
            self._components[htmlElement.tagName.toLowerCase()] = {
                element: htmlElement,
                Controller: Controller
            };
        }
    }
    ;
    _buildComponent(element) {
        var self = this;
        if (element.nodeType === element.ELEMENT_NODE) {
            return walkTheElement(element, function (element, children) {
                var clone;
                if (element.nodeType === element.ELEMENT_NODE) {
                    clone = document.createElement(element.tagName);
                    var attributes = element.attributes;
                    for (var x = 0; x < element.attributes.length; x++) {
                        var domAttribute = element.attributes.item(x);
                        var name = self._attributeNameToJavascriptName(domAttribute.name);
                        clone.setAttribute(domAttribute.name, domAttribute.value);
                        clone[name] = domAttribute.value;
                    }
                }
                else {
                    clone = document.createTextNode(element.textContent);
                }
                children.forEach(function (element) {
                    if (!element.tagName || (element.tagName && element.tagName.toLowerCase() !== "script")) {
                        clone.appendChildComponent(element);
                    }
                });
                return clone;
            });
        }
        else if (element.nodeType === element.TEXT_NODE) {
            return document.createTextNode(element.textContent);
        }
    }
    ;
}
module.exports = ComponentDocument;
//# sourceMappingURL=ComponentDocument.js.map