// Author: Edward Simon G. Valdez
// Version: 0.2.0

var azlabs = window.azlabs || (function (document, $) {

    var that = {};

    that.createView = function (/*elem, attribs, childElem, xdata*/) {

        var elem,
                attribs,
                childElem,
                result = false;

        switch (arguments.length) {
            case 1:
                elem = arguments[0];
                result = _createElement(elem);
                break;
            case 2:
                elem = arguments[0];
                attribs = arguments[1];

                result = _createElement({
                    'elem': elem, 'attribs': attribs
                });
                break;
            case 3:
                elem = arguments[0];
                attribs = arguments[1];
                childElem = arguments[2];

                result = _createElement({
                    'elem': elem,
                    'attribs': attribs,
                    'childElem': childElem
                });
                break;
        }

        return result;
    };

    function _createElement(data) {

        var element = document.createElement(data.elem);

        if (data.attribs) {
            for (var x in data.attribs) {
                if (data.attribs[x]) {
                    if (x === 'style') {
                        for (var i = 0; i < data.attribs[x].length; i++)
                            element.style[data.attribs[x][i].css] = data.attribs[x][i].value;
                    } else {
                        element.setAttribute(x, data.attribs[x]);
                    }
                }
            }
        }

        // if an element has child elements, insert it...
        if (data.childElem) {

            var childElem = data.childElem;

            if (Array.isArray(childElem)) {
                var l = childElem.length;
                for (var i = 0; i < l; i++) {
                    _appendChild(element, childElem[i]);
                }
            } else {
                _appendChild(element, childElem);
            }
        }

        // finally return the created element...
        return element;
    }

    function _appendChild(parent, child) {

        if (typeof child === 'object') {
            $(parent).append(child);
            return;
        }

        parent.innerHTML += child;

    }

    return that;

}(document, window.jQuery));

window.azlabs = azlabs;