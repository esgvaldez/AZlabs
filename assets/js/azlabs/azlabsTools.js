/* global inboundShipmentPlanLists, addressListModule, SettingsScene, x, bootbox */

window.onload = function () {

    var dynaScript = new DynaScript();
    dynaScript.run();

    selector.get('body').on('shown.bs.tab', function (evt) {

        var tabName = selector.get(evt.target, true).attr('href');

        if (tabName === '#content-A') {
            addressListModule.render();
        } else if (tabName === '#content-B') {
            // TODO
        } else if (tabName === '#content-C') {
            inboundShipmentPlanLists.render();
        } else if (tabName === '#tab-settings') {
            SettingsScene.destroy(true);
        }

    });

};

/* 
 --- Various Tools (v1.2.1) --- 
 */

function DynaScript() {

    var _addedJSfiles = "";
    var _scriptFilePaths = [
        '/wp-content/plugins/AZlabs/assets/js/azlabs/inboundshipment-createplan.js',
        '/wp-content/plugins/AZlabs/assets/js/azlabs/inboundshipment-planlist.js',
        '/wp-content/plugins/AZlabs/assets/js/azlabs/azlabs.floatmenu.js',
        '/wp-content/plugins/AZlabs/assets/js/azlabs/azlabs.settings.js'
    ];

    function run() {
        _includeAll();
        if (arguments.length === 1) {
            callback = arguments[0];
            if (typeof callback === 'function')
                callback();
        }
    }

    function _includeAll() {

        var allScriptTags = document.getElementsByTagName('script');
        if (allScriptTags.length > 0) {
            var scriptFileCount = _scriptFilePaths.length;
            for (var i = 0; i < scriptFileCount; i++) {

                if (_addedJSfiles.indexOf('[' + _scriptFilePaths[i] + ']') !== -1)
                    break;

                var script = document.createElement('script');
                script.setAttribute('src', _scriptFilePaths[i]);

                allScriptTags[0].parentNode.appendChild(script);
                _addedJSfiles += '[' + _scriptFilePaths[i] + ']';
            }

        }

    }

    return {
        run: run
    };

}
;

// truncates long word by adding ellipses at the end of the specified word length...
String.prototype.trunc = String.prototype.trunc || function (n) {
    return (this.length > n) ? this.substr(0, n - 1) + '...' : this;
};

var selector = (function () {

    var collection = {}, currSelector;
    var detachedCollection = {};

    function get(selector, newRef) {

        if (undefined === collection[selector] || newRef === true) {
            collection[selector] = $(selector);
        }

        currSelector = selector;
        return collection[selector];
    }

    function undef(selector) {

        var elem = (selector !== 'all') ? get(selector) : 'all';

        if (undefined !== elem && elem !== 'all') {

            collection[selector].remove();
            delete collection[selector];

        } else if (undefined !== elem && elem === 'all') {

            for (x in collection) {
                collection[x].remove();
                delete collection[x];
            }
        }

        return this;
    }

    function getActiveSelectors() {
        return Object.keys(collection);
    }

    return {
        get: get,
        undef: undef,
        getActiveSelectors: getActiveSelectors
    };

})();

var loadingOverlay = {
    on: function () {
        selector.get('.loading').css('visibility', 'visible');
    },
    off: function () {
        selector.get('.loading').css('visibility', 'hidden');
    }
};

var btnLoadingAnim = {
    on: function (owner) {
        selector.get(owner, true).addClass('disabled');
        selector.get(owner, true).find('.loading-img').addClass('glyphicon glyphicon-refresh animate-loading-btn');
    },
    off: function (owner) {
        selector.get(owner, true).removeClass('disabled');
        selector.get(owner, true).find('.loading-img').removeClass('glyphicon glyphicon-refresh animate-loading-btn');
    }
};

var azmodal = function (status) {

    var title = status.title || 'AZlabs',
            buttons = status.buttons || {
                main: {
                    className: 'btn-primary',
                    label: 'Ok',
                    callback: status.action || function () {
                    }
                }
            };

    bootbox.dialog({
        title: title,
        message: status.message,
        buttons: buttons
    }); // end bootbox	

};

var substringMatcher = function (strs) {
    
    return function findMatches(q, cb) {
        
        var matches, substrRegex;

        // an array that will be populated with substring matches
        matches = [];

        // regex used to determine if a string contains the substring `q`
        substrRegex = new RegExp(q, 'i');

        // iterate through the pool of strings and for any string that
        // contains the substring `q`, add it to the `matches` array
        $.each(strs, function (i, str) {
            if (substrRegex.test(str)) {
                matches.push(str);
            }
        });

        cb(matches);
    };
};