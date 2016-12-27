/**
 * Tests if an elements dimensions match certain expectations
 * @module monitors/element
 */
var isVisible = function (element) {
    var viewHeight = window.innerHeight;
    var bounds = element.getBoundingClientRect();
    return (bounds.top > 0 && bounds.top < viewHeight) || (bounds.bottom > 0 && bounds.bottom < viewHeight);
};
var toInt = function (value) {
    return parseInt(value, 10);
};

var exports = {
    trigger: {
        'resize': window,
        'scroll': window
    },
    test: {
        'visible': function (data) {
            data.seen = isVisible(data.element);
            return data.seen && data.expected;
        },
        'min-width': function (data) {
            return toInt(data.expected) <= data.element.offsetWidth;
        },
        'max-width': function (data) {
            return toInt(data.expected) >= data.element.offsetWidth;
        },
        'min-height': function (data) {
            return toInt(data.expected) <= data.element.offsetHeight;
        },
        'max-height': function (data) {
            return toInt(data.expected) >= data.element.offsetHeight;
        }
    }
};

module.exports = exports;