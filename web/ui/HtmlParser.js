"use strict";
var HtmlParser = (function () {
    function HtmlParser(document) {
        this.wrapperElement = document.createElement("div");
    }
    HtmlParser.prototype.parse = function (htmlMarkup) {
        var self = this;
        var wrapper = self.wrapperElement;
        var documentFragment = document.createDocumentFragment();
        wrapper.innerHTML = htmlMarkup;
        var childrenNodes = wrapper.childNodes;
        while (wrapper.childNodes.length > 0) {
            documentFragment.appendChild(wrapper.removeChild(wrapper.firstChild));
        }
        return documentFragment;
    };
    return HtmlParser;
}());
module.exports = HtmlParser;
//# sourceMappingURL=HtmlParser.js.map