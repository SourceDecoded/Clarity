class HtmlParser {
    wrapperElement: HTMLElement;

    constructor(document) {
        this.wrapperElement = document.createElement("div");
    }

    parse(htmlMarkup) {
        var self = this;
        var wrapper = self.wrapperElement;
        var documentFragment = document.createDocumentFragment();
        wrapper.innerHTML = htmlMarkup;
        var childrenNodes = wrapper.childNodes;
        while (wrapper.childNodes.length > 0) {
            documentFragment.appendChild(wrapper.removeChild(wrapper.firstChild));
        }
        return documentFragment;
    }
}

export = HtmlParser;