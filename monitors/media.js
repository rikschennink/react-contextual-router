/**
 * Tests if a media query is matched or not and listens to changes
 * @module monitors/media
 */
var exports = {
    data: {
        mql: null
    },
    trigger: function (bubble, data) {

        // if testing for support don't run setup
        if (data.expected === 'supported') {
            return;
        }

        // if is media query
        data.change = function () {
            bubble();
        };
        data.mql = window.matchMedia(data.expected);
        data.mql.addListener(data.change);

    },
    parse: function (value) {
        var results = [];
        if (value === 'supported') {
            results.push({
                test: 'supported',
                value: true
            });
        }
        else {
            results.push({
                test: 'query',
                value: value
            });
        }
        return results;
    },
    test: {
        'supported': function () {
            return 'matchMedia' in window;
        },
        'query': function (data) {
            return data.mql.matches;
        }
    },
    unload: function (data) {
        data.mql.removeListener(data.change);
    }
};

module.exports = exports;