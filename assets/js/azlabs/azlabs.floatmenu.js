
/* global selector, azevents, loadingOverlay */

var ClientSwitchingMenu = (function () {

    var clients = [];

    run(true);

    // BINDING EVENTS...
    selector.get('#fm-searchToggle').on('click', function () {
        _toggleSearch();
    });

    selector.get('#fm-refresh').on('click', run);
    selector.get('#fm-searchFieldContainer > input').keyup(_select);

    // PUBLIC FUNCTIONS...
    function run(/* callback, cacheRefresh */) {

        var callback = false,
                cacheRefresh = false;

        if (arguments.length === 2) {
            callback = arguments[0];
            cacheRefresh = arguments[1];
        } else {
            cacheRefresh = arguments[0];
        }

        azevents.ajaxrequest({
            'action': 'request_data',
            'modID': 'module_04',
            'load': 'getSelltecClients'
        }, function (response) {

            if (response) {

                if (cacheRefresh)
                    _pullClients(response.clients);

                if (callback && typeof callback === 'function')
                    callback(response.clients);

                if (response.current)
                    selector.get('#fm-currentClient').text(response.current);

            } else {
                selector.get('#fm-currentClient').text('NONE');
            }

        }, 'SelltecClients', cacheRefresh);
    }

    function getClients() {
        return clients;
    }

    function removeClient(clientID, callback) {

        if (clientID) {

            azmodal({
                title: 'Delete Client',
                message: '<span class="glyphicon glyphicon-question-sign"></span> Are you sure you want to Delete this client?',
                buttons: {
                    danger: {
                        className: 'btn-danger',
                        label: 'Cancel'
                    },
                    main: {
                        className: 'btn-primary',
                        label: 'Ok',
                        callback: function () {

                            azevents.ajaxrequest({
                                'action': 'request_data',
                                'modID': 'module_04',
                                'load': 'removeAPIkey',
                                'args': {
                                    'id': clientID
                                }
                            }, function (response) {
                                if (response && typeof callback === 'function') {
                                    loadingOverlay.on();
                                    run(function (r) {
                                        _setClient(0, function () {
                                            callback();
                                            location.reload();
                                        });
                                    }, true);
                                }
                            }, false, false);
                        }
                    }
                }
            });

        }
    }

    // PRIVATE FUNCTIONS...
    function _pullClients(listData) {

        clients = [];
        for (var i = 0; i < listData.length; i++) {
            clients.push({
                'id': listData[i].id,
                'client_name': listData[i].client_name
            });
        }

    }

    function _select(event) {

        if (event.keyCode === 13) {

            var success = false,
                    clientID = 0,
                    theClient = selector.get('.fm-clientNameInput', true).typeahead('val');

            for (var i = 0; i < clients.length; i++) {

                if (clients[i].client_name === theClient) {

                    clientID = clients[i].id;
                    success = true;
                    _toggleSearch();

                    break;
                }
            }

            if (success) {

                if (theClient !== selector.get('#fm-currentClient').text()) {
                    _changeUser(clientID, theClient);
                } else {
                    loadingOverlay.off();
                }

            } else {
                azmodal({
                    message: 'We don\'t have a client goes by that name...',
                    action: function () {
                        _clearField();
                    }
                });
            }

        }
    }

    function _changeUser(clientID, clientName) {

        loadingOverlay.on();
        _setClient(clientID, function (response) {

            azevents.emit('clearCache');
            if (response) {

                azevents.ajaxrequest({
                    'action': 'initialize_api'
                }, function (success) {

                    var msg = 'Unable to switch/serve Client',
                            action = function () {
                                selector.get('#fm-currentClient').text('NONE');
                                loadingOverlay.off();
                            };

                    if (success) {
                        msg = 'Client switch, SUCCESS!';
                        action = function () {
                            selector.get('#fm-currentClient').text(clientName);
                            loadingOverlay.off();
                        };
                    }

                    azmodal({
                        message: msg,
                        action: action
                    });

                });
            }
        });
    }

    function _setClient(clientID, callback) {

        if (typeof callback === 'function') {

            azevents.ajaxrequest({
                'action': 'request_data',
                'modID': 'module_04',
                'load': 'setCurrentClient',
                'args': {
                    'id': clientID
                }
            }, callback);
        }
    }

    function _toggleSearch() {

        _clearField();
        selector.get('#fm-currentClient').toggleClass('onEditor-hide');
        selector.get('#fm-searchFieldContainer').toggleClass('onEditor-hide');

        if (!selector.get('#fm-searchFieldContainer').hasClass('onEditor-hide')) {

            var clientNames = [];
            for (var i in clients) {
                clientNames.push(clients[i].client_name);
            }

            selector.get('#fm-searchFieldContainer .typeahead', true).typeahead({
                hint: true,
                highlight: true,
                minLength: 1,
                classNames: {
                    input: 'fm-clientNameInput',
                    highlight: 'fm-searchHighlight',
                    menu: 'fm-searchMenu',
                    cursor: 'fm-searchCursor',
                    suggestion: 'fm-searchSuggestion'
                }
            }, {
                name: 'SelltecClients',
                source: substringMatcher(clientNames)
            });
            
        } else {
            selector.get('#fm-searchFieldContainer .typeahead', true).typeahead('destroy');
        }
    }

    function _clearField() {
        selector.get('#fm-searchFieldContainer .typeahead').val('');
        selector.get('#fm-searchFieldContainer .typeahead', true).typeahead('close');
    }

    return {
        run: run,
        getClients: getClients,
        removeClient: removeClient
    };

})();