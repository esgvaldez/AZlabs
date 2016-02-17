/*	
    ===================================
    =    MODULE #1: [Address List]    =
    ===================================
*/
/* global azlabs, azevents, loadingOverlay, selector, bootbox */

var addressListModule = (function() {

    var address = [], pickedAddressIndex = 0, addrIndexSet = false;

    // DOM caching...
    var $addressModuleDOM, $ul, $li_choices, $choosenAddress;
    var $origRenderArea = $('#addressList-dropdown') || '';
    var $renderArea;

    // subscribe to Publish–subscribe event
    azevents.on('shipmentFrom_address_statechange', _reset);
    render();

    // Render view...
    function render(/* to, addrIndex */) { 

        var arg1 = false, arg2 = 0;

        if(arguments.length > 0) {
            arg1 = arguments[0] || arg1;
            arg2 = arguments[1] || arg2;
        }

        $renderArea = (arg1) ? arg1 : $origRenderArea;
        addrIndexSet = (arg2) ? arg2 : 0;

        azevents.emit(
            'shipmentFrom_address_statechange', 
            'shipment-address-reset'
        );

        azevents.ajaxrequest({
            'action' : 'request_data',
            'modID' : 'module_01',
            'load' : 'ShipmentFrom_AddressList'
        }, _buildView);

    }

    function getPickedAddressIndex() {
        return pickedAddressIndex;
    }

    function _buildView(addressList) {

        var list = '';

        for (var i = 0; i < addressList.length; i++) { 

            address[i] = addressList[i].name + '<br>' 
                + addressList[i].address_line_1 + '<br>' 
                + addressList[i].city + ',' 
                + addressList[i].state_or_province + ' '
                + addressList[i].postal_code + '</a> </li>';

            list += '<li id="addressChoice" addr-id="' + addressList[i].id + '"> <a href="#">' + address[i];
        }

        $renderArea.html(
            azlabs.createView('div', {'class' : 'dropdown', 'id':'address-module'}, 
            [
                azlabs.createView(
                    'button', 
                    {
                        'id' 		: 'address-dropdown-toggle',
                        'class' 	: 'btn btn-primary dropdown-toggle',
                        'type' 		: 'button',
                        'data-toggle' 	: 'dropdown'
                    }, 
                    '<span class="glyphicon glyphicon-home"></span> Ship from Address <span class="caret"></span> <p id="separator"></p> <p id="choosenAddress"> No Address </p>'
                ), 
                azlabs.createView(
                    'ul', {'class':'dropdown-menu', 'id':'ship-from', 'role':'menu'}, list
                )
            ]
        ));

        // Caching/Binding DOM from newly created view...
        $addressModuleDOM = $('#address-module');
        $ul = $('#ship-from');
        $li_choices = $('#addressChoice');
        $choosenAddress = $('#choosenAddress');

        // bind event...
        $ul.on('click', $li_choices, _writePickedAddress);

        if(addrIndexSet) {
            _writePickedAddress(addrIndexSet);
        }

    }

    function _writePickedAddress(event) {

        var index = parseInt($(event.target).closest('li').attr('addr-id')) || event;

        if(index && address.length > 0) {

            $choosenAddress.html(address[index - 1]);
            pickedAddressIndex = index;

            // TODO
            azevents.emit(
                'shipmentFrom_address_statechange', 
                'shipment-address-selected'
            );
        }

    }

    function _reset(reason) {

        if(reason === 'shipment-address-reset' && $addressModuleDOM) {

            $ul.off('click', $li_choices, _writePickedAddress);
            $addressModuleDOM.remove();

            if(address.length > 0)
                address.splice(0, address.length);

            pickedAddressIndex = 0;
        }

    }

    function test() {

        loadingOverlay.on();
        azevents.ajaxrequest({
            'action' : 'request_data',
            'modID' : 'module_01',
            'load' : 'invTest'
        }, function(response) {

            loadingOverlay.off();
            if(response) {
                azmodal({
                    message : JSON.stringify(response)
                });
            }

        });
    }

    return {
        render 					: render,
        getPickedAddressIndex	: getPickedAddressIndex,
        test : test
    };

})();

/*
    ========================================
    =    MODULE #2: [ASIN search field]    =
    ========================================
*/

var itemSearch = (function() {

    var animatedLoadingImgClass = 'glyphicon glyphicon-refresh animate-loading-btn';

    var matchedSKUs, itemName;
    var selectedItemForInbound = [];

    // "No result" display template...
    var noResult = azlabs.createView(
        'div', {'id':'no-results'}, 
        '<h3><span class="glyphicon glyphicon-search"></span> No results found...</h3>'
    );

    // DOM cache...
    var $search_asin_form = $('.search-asin-form') || '';
    var $search_result_view = $('#search-result') || '';

    var $item_lookup_searchfield = $search_asin_form.find('#item-lookup') || '';
    var $search_button = $search_asin_form.find('button.item-search-btn') || '';

    var $search_result_container = $search_result_view.find('.searched-data') || ''; // the search result container
    var $result_image = $search_result_container.find('img') || '';
    var $result_itemname_link = $search_result_container.find('#searched-itemname') || '';
    var $result_itemauthor = $search_result_container.find('#searched-itemauthor') || '';
    var $result_itemmanufacturer = $search_result_container.find('#searched-itemmanufacturer') || '';
    var $add_to_plan_modal = $search_result_container.find('#addToPlan') || '';

    // modal current state indicator...
    var isModalCalled = false;
    // caching modal content...
    var $msku_item_match, $adding_error, $add_msku_field, $add_qty_field;
    var modalContent = azlabs.createView('div', {'id':'add-item-to-plan'}, 
        azlabs.createView('div', {'id':'add-item-to-plan-body'}, 
        [
            '<div id="msku-item-match"></div>',
            '<div id="adding-item-to-plan-error"></div>',
            azlabs.createView('form', {'class':'form-horizontal', 'role':'form'}, 
            [
                azlabs.createView('div', {'class':'form-group'}, 
                [
                    '<label class="control-label col-sm-2" for="email">MSKU:</label>',
                    azlabs.createView('div', {'class':'col-sm-10'}, 
                        '<input type="text" class="form-control" id="added-item-msku" placeholder="Enter product MSKU">'
                    )
                ]),
                azlabs.createView('div', {'class':'form-group'}, 
                [
                    '<label class="control-label col-sm-2" for="pwd">QUANTITY:</label>',
                    azlabs.createView('div', {'class':'col-sm-10'}, 
                        '<input type="text" class="form-control" id="qty" placeholder="Quantity" value="1">'
                    )
                ])
            ])
        ])
    );

    // binding events...
    $search_button.on('click', performSearch);
    $add_to_plan_modal.on('click', _callModal); //[Modal]

    azevents.on('shipmentFrom_address_statechange', searchFormBehavior);

    // MODULE functions...

    function performSearch(keyword) {

        var searchString = (typeof keyword === 'string') ? keyword : $item_lookup_searchfield.val();

        if(searchString) {
            _toggleSearchBtnState(false);
            azevents.ajaxrequest({
                'action' : 'request_data',
                'modID' : 'module_01',
                'load' : 'ItemLookup',
                'args' : {'ASIN':searchString}
            }, _renderResult);
        }
    }

    function searchFormBehavior(option) {

        if(option && (option === 'shipment-address-reset')) {
            if(!$search_asin_form.hasClass('hidden'))
                $search_asin_form.addClass('hidden');
        }else if(option && (option === 'shipment-address-selected')) {
            if($search_asin_form.hasClass('hidden')) 
                $search_asin_form.removeClass('hidden');
        }

        clearResult();

    }

    function clearResult() {

        clearSearchField();

        if(!$search_result_container.hasClass('hidden')) 
            $search_result_container.addClass('hidden');

        $result_image.attr('src', '');
        $result_itemname_link.attr('href', '#');
        $result_itemname_link.text('');
        $result_itemauthor.text('');
        $result_itemmanufacturer.text('');

    }

    function clearSearchField() {

        $item_lookup_searchfield.val('');

        var NoResultsIndicator = selector.get('#no-results', true).html(),
            resultsIndicator = !$search_result_container.hasClass('hidden');

        if(NoResultsIndicator) {
            selector.get('#no-results', true).remove();
        }else if(resultsIndicator){
            $search_result_container.addClass('hidden');
        }

        if(selectedItemForInbound.length > 0)
            selectedItemForInbound.splice(0, selectedItemForInbound.length);
    }

    function getSelectedItemForInbound() {
        return selectedItemForInbound;
    }

    function removeSelectedItemForInbound(index) {
        selectedItemForInbound.splice(index, 1);
    }

    /*	
        @param: TRUE 	-> 	enabled
                FALSE 	->	disabled 
    */
    function _toggleSearchBtnState(flag) {
        if(flag) {
            $search_button.removeClass('disabled');
            $search_button.find('.loading-img').removeClass(animatedLoadingImgClass);
        }else {
            $search_button.addClass('disabled');
            $search_button.find('.loading-img').addClass(animatedLoadingImgClass);
        }
    }

    function _renderResult(searchdata) {

        clearSearchField();
        var result = searchdata.Item || false;
        var skus = searchdata.Skus || false;

        if(result) {

            if($search_result_container.hasClass('hidden'))
                $search_result_container.removeClass('hidden');

            $result_image.attr('src', result.Image);
            $result_itemname_link.attr('href', (result.DetailPageURL || '#'));
            $result_itemname_link.text(result.Title);
            $result_itemauthor.text((result.Author || 'N/A'));
            $result_itemmanufacturer.text((result.Manufacturer || 'N/A') + ' | ' + (result.ProductGroup || 'N/A'));

            /*
                This are the records of MSKUs of the data searched...
                to be used later when "Add to plan" modal is called...
            */
            itemName = result.Title;
            matchedSKUs = skus;

        }else {
            $search_result_view.append(noResult);
        }

        _toggleSearchBtnState(true);
    }

    // MODAL functions...

    function _callModal() { 

            // The Modal Form...
            bootbox.dialog({
                title : 'To Inbound Shipment Plan',
                message : modalContent,
                buttons : {
                    danger : {
                        label : 'Cancel',
                        className : 'btn-danger',
                        id : 'cancel-adding-item-to-plan',
                        callback : _modalClear
                    },
                    success : {
                        label : 'Save',
                        className : 'btn-success',
                        id : 'save-added-item-to-plan',
                        callback : _modalSave
                    }
                }
            }); // end bootbox dialog

            if(!isModalCalled) { // if modal is already called, there's no reason to cache the DOM of the modal... 

                $msku_item_match = $('#add-item-to-plan').find('#msku-item-match');
                $adding_error = $('#add-item-to-plan').find('#adding-item-to-plan-error');
                $add_msku_field = $('#add-item-to-plan').find('#added-item-msku');
                $add_qty_field = $('#add-item-to-plan').find('#qty');

                isModalCalled = true;
            }

            // This is where we can use the "matchedSKUs", if there is any data in it...
            if(matchedSKUs) {

                // render the data to display it on a table...
                var content = [];
                var skuListCount = matchedSKUs.length;

                for (var i = 0; i < skuListCount; i++) {

                    var tableContent = [];
                    for(var key in matchedSKUs[i]) {

                        var tableData = matchedSKUs[i][key] || 'no-data';
                        tableContent.push(azlabs.createView('td', {'id':key+'-'+(i+1)}, tableData));

                    }

                    // Will now create a button to retrieve information on its respective "<tr>" data
                    tableContent.push(azlabs.createView(
                        'td', {}, '<button class="btn btn-success select-msku" data-id="'+(i+1)+'">Use</button>'
                    ));

                    content.push(azlabs.createView('tr', {}, tableContent));

                }// end for...

                // Finally, render the constructed table data and attach it to the modal...
                $msku_item_match.html(azlabs.createView(
                    'table', {'class':'table', 'id':'msku-table'},
                    [
                        azlabs.createView(
                            'thead', {}, azlabs.createView(
                                'tr', {}, 
                                [
                                    '<th>MSKU</th>',
                                    '<th>QUANTITY</th>',
                                    '<th>Action</th>'
                                ]
                            )
                        ),
                        azlabs.createView('tbody', {}, content)
                    ]
                ));

                // the button we created earlier must have a function...attaching events...
                $('.select-msku').on('click', _supplyDataToModalFields);
            }
    }

    function _supplyDataToModalFields(evt) {
        var trIndex = evt.target.getAttribute('data-id');
        var msku = $('#seller_sku-'+trIndex).text(),
            qty = parseInt($('#total_supply_qty-'+trIndex).text()) || 1;

        $add_msku_field.val(msku);
        $add_qty_field.val(qty);
    }

    function _modalSave() {

        var msku = $add_msku_field.val() || false,
            qty = $add_qty_field.val() || false;

        if(msku && qty) {

            selectedItemForInbound.push({
                'itemName'	: itemName,
                'msku' 		: msku,
                'qty'		: qty
            });

            azevents.emit('inbound_shipment_item', 'item_added_for_inbound');
        }

        _modalClear();
    }

    function _modalClear() {
        $msku_item_match.html('');
        $adding_error.html('');
        $add_msku_field.val('');
        $add_qty_field.val('1');
    }

    return {
        performSearch			: performSearch,
        clearResult 			: clearResult,
        searchFormBehavior 		: searchFormBehavior,
        getSelectedItemForInbound	: getSelectedItemForInbound,
        removeSelectedItemForInbound	: removeSelectedItemForInbound
    };

})();

/*  NOTE: Self executing, Non API type of Module...
    ==========================================
    =    MODULE #3: [Added items on Plan]    =
    ==========================================
*/

(function() {

    // A pubsub event this module was subscribed...
    azevents.on('inbound_shipment_item', _render);

    // bind event...
    selector.get('#inbound-prep').on('click', _rowBtnAction);
    selector.get('#save-inbound').on('click', _savePlan);

    function _render(type) {

        if(type === 'item_added_for_inbound' || type === 1) {

            var item = itemSearch.getSelectedItemForInbound();
            var itemCount = item.length;

            selector.get('#inbound-prep').empty();
            for(var i = 0; i < itemCount; i++) {

                selector.get('#inbound-prep').append(azlabs.createView(
                    'tr', {'data-index':i, 'data-itemName':item[i].itemName}, 
                    [
                        azlabs.createView(
                            'td', {}, 
                            '<input type="text" style="border:none; border-color:none;" value="' + item[i].msku + '">'
                        ),
                        azlabs.createView(
                            'td', {'class':'inbound-item-qty'}, 
                            '<input type="text" style="border-color:#C6C6C6;" value="' + item[i].qty + '">'
                        ),
                        azlabs.createView(
                            'td', {}, 
                            '<button class="btn btn-danger inbound-item-del-btn"> <span class="glyphicon glyphicon-remove-sign"></span> </button>'
                        )
                    ]
                ));
            }

            if(selector.get('#inbound-prep').html() && selector.get('#save-inbound').hasClass('disabled')) {
                selector.get('#save-inbound').removeClass('disabled');
            }else if(!selector.get('#inbound-prep').html() && !selector.get('#save-inbound').hasClass('disabled')) {
                selector.get('#save-inbound').addClass('disabled');
            }

        }
    }

    function _rowBtnAction(evt) {

        var elemClass = evt.target.className;

        if(elemClass.indexOf('inbound-item-del-btn') !== -1) {

            var $elem = $(evt.target).closest('tr');
            var index = $elem.attr('data-index') || 0;
            
            bootbox.confirm('Are you sure you want to remove this item from plan?', function(result) {				
                if(result) {
                    itemSearch.removeSelectedItemForInbound(index);
                    $elem.remove();
                    _render(1);
                }
            });

        }

        evt.stopPropagation();
    }

    function _savePlan() {
        if(_qtyCheck()) {
            bootbox.prompt('Inbound Shipment plan name:', function(result) {
                if(result) {
                    var planName = result,
                        planData = _getItemsData();

                    loadingOverlay.on();
                    azevents.ajaxrequest({
                        'action' : 'request_data',
                        'modID' : 'module_01',
                        'load' : 'SaveInboundShipmentPlan',
                        'args' : {
                            'planName':planName,
                            'planData':planData,
                            'pickupAddrIndex':addressListModule.getPickedAddressIndex()
                        }
                    }, function(response) {
                        if(response) {
                            addressListModule.render();
                            itemSearch.clearResult();
                            selector.get('#inbound-prep').empty();
                        }

                        loadingOverlay.off();
                    }, false, false);
                }
            });
        }
    }

    function _getItemsData() {
        var data = [];
        selector.get('#inbound-prep').each(function(index) {
            var $tr = $(this).find('tr');
            $tr.each(function() {
                var td = $(this).find('td');
                data.push({
                    'itemName'	: $(this).attr('data-itemName'),
                    'msku' 	: $(td[0]).find('input').val(), 
                    'qty' 	: $(td[1]).find('input').val()
                });
            });
        });

        return data;
    }

    function _qtyCheck() {

        var $qtyTD = $('.inbound-item-qty');
        var inputError = false;

        $qtyTD.each(function(index) {
            var $qtyField = $(this).find('input');
            var qty = parseInt($qtyField.val()) || 0;

            if(qty <= 0) {
                $qtyField.css('border-color','#DD3D38');
                inputError = true;
            }else {
                $qtyField.css('border-color','#C6C6C6');
            }
        });

        if(inputError) {
            bootbox.alert('Quantity field must contain only a positive number.');
            return false;
        }

        return true;
    }

})();