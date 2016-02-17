// Publish–subscribe pattern

var azevents = (function() {

    var cache = {}, events = {}, ajax_url = ajaxurl || false;

    on('clearCache', _clearCache);

    function on(eventName, fn) {
        events[eventName] = events[eventName] || [];
        events[eventName].push(fn);
    }

    function off(eventName) {
        if (events[eventName]) {
            for (var i = 0; i < events[eventName].length; i++) {
                if (events[eventName][i] === fn) {
                    events[eventName].splice(i, 1);
                    break;
                }
            }
        }
    }

    function emit(eventName, data) {
        if (events[eventName]) {
            events[eventName].forEach(function(fn) {
                fn(data);
            });
        }
    }

    function ajaxrequest(ajaxdata, callback, cacheID, cacheRefresh) {

        if(!callback || typeof callback !== 'function') return;
        cacheRefresh = (!cacheRefresh) ? -1 : 1; // default FALSE

        if(cacheID && (cache[cacheID] !== undefined && cache[cacheID]) && cacheRefresh == -1) {
            callback(JSON.parse(cache[cacheID]));
            return;
        }

        $.post(ajax_url, ajaxdata, function(response) {

            if(cacheID && cacheRefresh)
                cache[cacheID] = response;

            if(response) {

                if(typeof response === 'string' && (response.toUpperCase()).indexOf('ERROR') > -1) {
                    response = false;
                }else if(typeof response === 'object') {
                    var strForm = (JSON.stringify(response)).toUpperCase();
                    response = (strForm.indexOf('ERROR') > -1) ? false : response;
                }

                callback(JSON.parse(response));
            }else {
                callback(false);
            }

        });
    }

    function _clearCache() { cache = {}; }

    return {
        on : on, 
        off : off, 
        emit : emit, 
        ajaxrequest : ajaxrequest, 
    }

})();

setInterval(function() { azevents.emit('clearCache'); }, (1000 * 60 * 10));