/* global selector, azlabs, btnLoadingAnim, azevents, loadingOverlay, ClientSwitchingMenu */

function SettingsViewHandler() {

    var views = {};
    var currView = '';

    function setView(viewName, view) {
        if(views[viewName] === undefined) views[viewName] = view;
    }

    function viewFor(viewName) {

        if(viewName && (views[viewName] !== undefined)) {

            if(currView !== viewName) {

                if(views[currView] !== undefined) {
                    views[currView].destroy();
                }

                views[viewName].render();
                currView = viewName;
            }

            if(views[currView].isClosed || SettingsScene.isClosed) {
                views[viewName].render();
                SettingsScene.isClosed = views[currView].isClosed = false;
            }
        }
    }

    return {
        setView : setView,
        viewFor : viewFor
    };
}

/* Prototypal Inheritance */
var SettingsScene = {
    canvas : '.settingsContainer',
    view : false,
    eventsBind : false,
    isClosed : false,
    create: function(values) {

        var instance = Object.create(this);

        Object.keys(values).forEach(function(key) {
            instance[key] = values[key];
        });

        return instance;
    },
    render : function() {
        if(this.view) {

            selector.get(this.canvas).html(this.view);

            if(this.eventsBind && typeof this.eventsBind === 'function') {
                this.eventsBind();
            }

            if(this.run && typeof this.run === 'function') {
                this.run();
            }

        }
    },
    destroy : function(closedFlag) {
        selector.get(this.canvas).empty();
        this.isClosed = (closedFlag)? closedFlag : false;
    }
};

// View creation...
var CreateContactView = SettingsScene.create({

    view : azlabs.createView('div', {'class':'box col-md-4'}, 
        azlabs.createView('fieldset', {}, 
        [
            '<legend>Add New Contact Form <span id="closeCreateContactView" class="glyphicon glyphicon-remove pull-right" style="color:#FF0000; cursor:pointer;"></span></legend>',
            azlabs.createView('div', {'class':'form-group', 'id':'createContactForm'}, 
            [
                    '<label for="cName">Name:</label> <input class="form-control" id="cName" type="text">',
                    '<label for="cPhone">Phone:</label> <input class="form-control" id="cPhone" type="text">',
                    '<label for="cEmail">Email:</label> <input class="form-control" id="cEmail" type="text">',
                    '<label for="cFax">Fax:</label> <input class="form-control" id="cFax" type="text">'
            ]),
            '<button class="btn btn-primary form-control" id="saveContact"><span class="loading-img"></span> Save</button>'
        ])
    ),
    eventsBind : function() {

        selector.get('#closeCreateContactView').on('click', function(evt) { 
                selector.get('#createContactForm > input').val('');
                CreateContactView.destroy(true);
        });

        selector.get('#saveContact').on('click', function(evt) {

            var status = false;
            var name = selector.get('#cName', true).val() || false,
                phone = selector.get('#cPhone', true).val() || false,
                email = selector.get('#cEmail', true).val() || false,
                fax = selector.get('#cFax', true).val() || false;

            if(!name || !phone || !email || !fax) {
                azmodal({message : 'Please don\'t leave any of the fields empty.'});
                return;
            }

            btnLoadingAnim.on(evt.target);
            azevents.ajaxrequest({
                'action' : 'request_data',
                'modID' : 'module_04',
                'load' : 'addNewContact',
                'args' : {
                    'name' : name,
                    'phone' : phone,
                    'email' : email,
                    'fax' : fax
                }
            }, function(response) { // Success Status
                status = azlabs.createView('div', {},
                [
                    '<h2><strong>Added New Contact!</strong></h2>',
                    azlabs.createView('table', {'class':'table'}, 
                    [
                        azlabs.createView('tr', {}, 
                        [
                                '<td><b>Name:</b></td>',
                                '<td>'+name+'</td>'
                        ]),
                        azlabs.createView('tr', {}, 
                        [
                                '<td><b>Phone:</b></td>',
                                '<td>'+phone+'</td>'
                        ]),
                        azlabs.createView('tr', {}, 
                        [
                                '<td><b>Email:</b></td>',
                                '<td>'+email+'</td>'
                        ]),
                        azlabs.createView('tr', {}, 
                        [
                                '<td><b>Fax:</b></td>',
                                '<td>'+fax+'</td>'
                        ])
                    ])
                ]);

                azmodal({
                    message : status,
                    action : function() {
                        selector.get('#createContactForm > input').val('');
                        btnLoadingAnim.off(evt.target);
                    }
                });

            }, function() { // Fail Status
                status = 'There\'s a problem with adding the new contact. Sorry for inconvenience, Please try again later.';

                azmodal({
                    message : status,
                    action : function() {
                        selector.get('#createContactForm > input').val('');
                        btnLoadingAnim.off(evt.target);
                    }
                });

            }); // end ajaxrequest...

        });
    }
});

var AddNewAddressView = SettingsScene.create({
    view : azlabs.createView('div', {'class':'box col-md-7'}, 
        azlabs.createView('fieldset', {}, 
        [
            '<legend>Add "Ship From" Address <span id="closeAddNewAddressView" class="glyphicon glyphicon-remove pull-right" style="color:#FF0000; cursor:pointer;"></span></legend>', 
            azlabs.createView('div', {'class':'form-group', 'id':'addShipFromForm'}, 
            [
                '<label for="aName">* Address Name:</label> <input class="form-control" id="aName" type="text">',
                '<label for="addLine1">* Address Line 1:</label> <input class="form-control" id="addLine1" type="text">',
                '<label for="addLine2">Address Line 2:</label> <input class="form-control" id="addLine2" type="text">',
                '<label for="addCity">* City:</label> <input class="form-control" id="addCity" type="text">',
                '<label for="districtOrCountry">District / Country:</label> <input class="form-control" id="districtOrCountry" type="text">',
                '<label for="stateOrProvince">State / Provine:</label> <input class="form-control" id="stateOrProvince" type="text">',
                '<label for="countryCode">* Country code:</label> <input class="form-control" id="countryCode" type="text">',
                '<label for="postalCode">Postal code:</label> <input class="form-control" id="postalCode" type="text">'
            ]),
            '<p>fields marked with (*) are important...</p>',
            '<button class="btn btn-primary pull-right btn-block" id="saveAddress"><span class="loading-img"></span> Save</button>'
        ])
    ),
    eventsBind : function() {

        selector.get('#closeAddNewAddressView').on('click', function() {
            AddNewAddressView.destroy(true);
        });

        selector.get('#saveAddress').on('click', function(evt) {

            var name = selector.get('#aName', true).val(),
                addLine1 = selector.get('#addLine1', true).val(),
                addLine2 = selector.get('#addLine2', true).val(),
                addCity = selector.get('#addCity', true).val(),
                districtOrCountry = selector.get('#districtOrCountry', true).val(),
                stateOrProvince = selector.get('#stateOrProvince', true).val(),
                countryCode = selector.get('#countryCode', true).val(),
                postalCode = selector.get('#postalCode', true).val();

            if(name && addLine1 && addCity && countryCode) {

                btnLoadingAnim.on(evt.target);
                azevents.ajaxrequest({
                    'action' : 'request_data',
                    'modID' : 'module_04',
                    'load' : 'addNewShipFromAddress',
                    'args' : {
                        'addrName' : name,
                        'addrLine1' : addLine1,
                        'addrLine2' : addLine2,
                        'addrCity' : addCity,
                        'addrDistCountry' : districtOrCountry,
                        'addrStProv' : stateOrProvince,
                        'addrCCode' : countryCode,
                        'addrPCode' : postalCode
                    }
                }, function(response) {

                    var message = 'adding new "Ship From" address failed.';
                    if(response) 
                        message = 'new "Ship From" address added.';

                    azmodal({
                        message : message,
                        action : function() {
                            selector.get('#addShipFromForm > input').val('');
                            btnLoadingAnim.off(evt.target);
                        }
                    });	
                });
            }

        });
    }
});

var ManageContactsView = SettingsScene.create({
    view : azlabs.createView('div', {'class':'box col-md-8'},
        azlabs.createView('fieldset', {}, 
        [
            '<legend>Manage Contacts <span id="closeManageContactsView" class="glyphicon glyphicon-remove pull-right" style="color:#FF0000; cursor:pointer;"></span></legend>',
            azlabs.createView('div', {'class':'scrollable settingsScrollableView'}, 
                azlabs.createView('table', {'class':'table table-responsive'}, 
                [
                    azlabs.createView('thead', {}, 
                        azlabs.createView('tr', {}, 
                        [
                            '<th>Contact Info</th>',
                            '<th>Actions</th>'
                        ])
                    ),
                    azlabs.createView('tbody', {'id':'contactsList'}, false)
                ])
            )
        ])
    ),
    eventsBind : function() {

        selector.get('#closeManageContactsView').on('click', function(evt) { 
            ManageContactsView.destroy(true);
        });

    },
    run : function() {

        loadingOverlay.on();
        azevents.ajaxrequest({
            'action' : 'request_data',
            'modID' : 'module_04',
            'load' : 'retrieveContacts'
        }, function(info) { // success...

            if(info) {

                var defaultContactID = info.defaultContactID || false;
                info = info.list;

                selector.get('#contactsList').empty();
                for(var i = 0; i < info.length; i++) {

                    var defaultContactBtn = azlabs.createView('button', {'class':'btn btn-primary settingBtn', 'name':'setDefaultContact'}, '<span class="loading-img"></span> Set default');

                    if(info[i].id === defaultContactID) {
                        selector.get(defaultContactBtn, true).addClass('disabled');
                        selector.get(defaultContactBtn, true).text('DEFAULT');
                    }

                    selector.get('#contactsList').append(
                        azlabs.createView('tr', {}, 
                        [
                            '<td>' + info[i].name + ' (' + info[i].phone + ')' + '</td>',
                            azlabs.createView('td', {'class':'contactsOpt', 'id':info[i].id}, 
                            [
                                defaultContactBtn,
                                '<button class="btn btn-danger settingBtn" name="deleteContact"><span class="glyphicon glyphicon-trash"></span></button>'
                            ])
                        ])
                    );
                } // end for...

                // Bind Event...
                selector.get('.settingBtn', true).on('click', function() {

                    var fn = this.name,
                            id = selector.get(this, true).parent().attr('id'),
                            root = selector.get(this, true).parent().parent();

                    if(fn === 'setDefaultContact')
                            btnLoadingAnim.on('.settingBtn[name='+fn+']');

                    azevents.ajaxrequest({
                            'action' : 'request_data',
                            'modID' : 'module_04',
                            'load' : fn,
                            'args' : {
                                'id' : id
                            }
                    }, function(response) {

                        if(response) {
                            if(fn === 'setDefaultContact') {
                                ManageContactsView.run();
                                btnLoadingAnim.off(this);
                            }else if(fn === 'deleteContact') {
                                root.remove();
                                ManageContactsView.run();
                            }
                        }

                    }, false, false);

                });

            }

            loadingOverlay.off();
        });
    }
});

var NewClientAPIview = SettingsScene.create({
    view : azlabs.createView('div', {'class':'box col-md-8'}, 
        azlabs.createView('fieldset', {}, 
        [
            '<legend>Client API key management <span id="closeNewClientAPIview" class="glyphicon glyphicon-remove pull-right" style="color:#FF0000; cursor:pointer;"</legend>',
            azlabs.createView('div', {'class':'form-group', 'id':'addAPIkeyForm'}, 
            [
                '<label for="clientName">Client name:</label> <input class="form-control" id="clientName" type="text">',
                '<label for="sellerID">Seller ID:</label> <input class="form-control" id="sellerID" type="text">',
                '<label for="marketID">Markteplace ID:</label> <input class="form-control" id="marketID" type="text">',
                '<label for="MWSauthToken">MWS Auth Token:</label> <input class="form-control" id="MWSauthToken" type="text">'
            ]),
            '<button class="btn btn-primary pull-right" id="saveAPIkey"><span class="glyphicon glyphicon-save"></span> Save</button>'
        ])
    ),
    eventsBind : function() {

        selector.get('#closeNewClientAPIview').on('click', function() {
            NewClientAPIview.destroy(true);
        });

        selector.get('#saveAPIkey').on('click', function() {

            var clientName = selector.get('#clientName', true).val() || false, 
                    sellerID = selector.get('#sellerID', true).val() || false, 
                    marketID = selector.get('#marketID', true).val() || false,
                    mwsAuthToken = selector.get('#MWSauthToken', true).val() || false;

            if(clientName && sellerID && marketID) {
                loadingOverlay.on();
                azevents.ajaxrequest({
                    'action' : 'request_data',
                    'modID' : 'module_04',
                    'load' : 'addAPIkey',
                    'args' : {
                        'clientName' : clientName,
                        'sellerID' : sellerID,
                        'marketID' : marketID,
                        'mwsAuthToken' : mwsAuthToken
                    }
                }, function(result) {

                    var message = 'Adding API key, Failed...';
                    if(result) 
                        message = 'Adding API key, Success!';

                    azmodal({
                        message : message,
                        action : function() {
                            ClientSwitchingMenu.run(function() {
                                selector.get('#addAPIkeyForm > input').val('');
                                loadingOverlay.off();
                            }, true);
                        }
                    });	
                });
            }
        });

    }
});

var ViewClients = SettingsScene.create({
    view : azlabs.createView('div', {'class':'box col-md-6'},
        azlabs.createView('fieldset', {}, 
        [
            '<legend>Selltec Clients <span id="closeViewClientsView" class="glyphicon glyphicon-remove pull-right" style="color:#FF0000; cursor:pointer;"</legend>',
            azlabs.createView('div', {'class':'scrollable settingsScrollableView', 'style':[{'css':'height', 'value':'430px'}]}, 
                azlabs.createView('table', {'class':'table table-responsive table-hover'}, 
                [
                    azlabs.createView('thead', {'style':[{'css':'background-color', 'value':'#337AB7'}, {'css':'color', 'value':'#ffffff'}]}, 
                        azlabs.createView('tr', {}, 
                        [
                            '<th>Client</th>',
                            '<th>Actions</th>'
                        ])
                    ),
                    '<tbody id="clientListView"></tbody>'
                ])
            )
    ])
    ),
    eventsBind : function() {
        selector.get('#closeViewClientsView').on('click', function() {
            ViewClients.destroy(true);
        });
    }, 
    run : function() {

        var list = ClientSwitchingMenu.getClients(),
            listCount = list.length;

        selector.get('#clientListView').empty();
        for(var i = 0; i < listCount; i++) {			
            selector.get('#clientListView').append(
                azlabs.createView('tr', {'data-clientID':list[i].id}, 
                [
                    '<td>' + list[i].client_name + '</td>',
                    '<td><button class="btn btn-primary clientListingAction" name="clientEdit"><span class="glyphicon glyphicon-edit"></span></button> <button class="btn btn-danger clientListingAction" name="clientRemove"><span class="glyphicon glyphicon-trash"></span></button></td>'
                ])
            );
        }

        selector.get('.clientListingAction', true).on('click', function() {

            var name = this.name,
                clientID = selector.get(this, true).parent().parent().attr('data-clientID'),
                root = selector.get(this, true).parent().parent();

            if(name === 'clientEdit') {

                loadingOverlay.on();
                azevents.ajaxrequest({
                        'action' : 'request_data',
                        'modID' : 'module_04',
                        'load' : 'editClientInfo',
                        'args' : {
                            'id' : clientID,
                            'action' : 'edit'
                        }
                },function(response) {

                    loadingOverlay.off();
                    if(response) {

                        var clientName = response.client_name,
                            sellerID = response.seller_id,
                            marketID = response.marketplace_id,
                            MWSauthToken = response.mws_auth_token || '';

                        azmodal({
                            message : azlabs.createView('fieldset', {}, 
                            [
                                '<legend>Edit Client API info</legend>',
                                azlabs.createView('div', {'class':'form-group', 'id':'addAPIkeyForm'}, 
                                [
                                    '<label for="clientName">Client name:</label> <input class="form-control" id="clientName" type="text" value="'+clientName+'">',
                                    '<label for="sellerID">Seller ID:</label> <input class="form-control" id="sellerID" type="text" value="'+sellerID+'">',
                                    '<label for="marketID">Markteplace ID:</label> <input class="form-control" id="marketID" type="text" value="'+marketID+'">',
                                    '<label for="MWSauthToken">MWS Auth Token:</label> <input class="form-control" id="MWSauthToken" type="text" value="'+MWSauthToken+'">'
                                ])
                            ]),
                            buttons : {
                                danger : {
                                    className : 'btn btn-danger',
                                    label : 'Cancel'
                                },
                                main : {
                                    className : 'btn btn-primary',
                                    label : 'Save',
                                    callback : function() {
                                        azevents.ajaxrequest({
                                            'action' : 'request_data',
                                            'modID' : 'module_04',
                                            'load' : 'editClientInfo',
                                            'args' : {
                                                'id' : clientID,
                                                'clientName' : clientName,
                                                'sellerID' : sellerID,
                                                'marketID' : marketID,
                                                'MWSauthToken' : MWSauthToken,
                                                'action' : 'update'
                                            }
                                        },function(response) {

                                            var msg = 'Updating Client API info failed.';
                                            if(response) {
                                                    msg = 'Updating Client API info succeed!';
                                            }
                                            azmodal({message : msg});

                                        }, false, false);
                                    }
                                }
                            }
                        });
                    }
                }, false, false);

            }else if(name === 'clientRemove') {
                ClientSwitchingMenu.removeClient(clientID, function() { root.remove(); });
            }

        });
    }
});

/*  ============= 
        MAIN 
    ============= */

(function() {

	// View handler...
	var svh = new SettingsViewHandler();
	svh.setView('registerNewContact', CreateContactView);
	svh.setView('registerNewAddress', AddNewAddressView);
	svh.setView('manageContacts', ManageContactsView);
	svh.setView('registerNewClientKey', NewClientAPIview);
	svh.setView('getClientKey', ViewClients);

	// Bind event...
	selector.get('.settingOpt').on('click', _handler);

	function _handler(evt) {
			
            var optName = selector.get(evt.target, true).attr('name') || false;

            if(optName)
                svh.viewFor(optName);

	}

})();