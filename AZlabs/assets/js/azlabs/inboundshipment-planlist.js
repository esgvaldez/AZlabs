
/*
	================================
				MODULE 1
	================================
*/

var inboundShipmentPlanLists = (function() {
		
	var	boxColors = ['#EE4035', '#F37736', '#7BC043', '#0392CF', '#5F9EA0', '#8A2BE2'];
	var currentPlanCount = 0;

	// event bind...
	selector.get('.refreshShipmentList').on('click', render);
	selector.get('.syncShipmentList').on('click', _syncAnInbound);

	function render(evt) {

		azevents.emit('InShipPlan-clearEditor');
		loadingOverlay.on();

		var cacheID = 'inbound-shipment-plans',
			cacheRefresh = false;

		if(evt !== undefined && ((evt === 'refresh') || (evt.target).name === 'refresh')) cacheRefresh = true;

		azevents.ajaxrequest({
			'action' : 'request_data',
			'modID' : 'module_03',
			'load' : 'getPlans',
		}, _renderBoxView, cacheID, cacheRefresh);

	}

	function _renderBoxView(result) {
	
		selector.undef('.InShipPlan-box');
		if(!result) {
			loadingOverlay.off();
			return;
		}
		
		selector.undef('.InShipPlan-box');
		selector.undef('.shipment-review-data');

		var planCount = result.length;

		for(var i = 0; i < planCount; i++) {
			
			var randIndex = Math.floor(Math.random() * boxColors.length),
				planName = result[i].shipment_name,
				planInfo = planName + '|' + result[i].shipment_id + '|' + result[i].destination_fulfillment_center + '|' + result[i].address_id;

			var $littlePlanBox = azlabs.createView(
				'div', {'class':'InShipPlan-box', 'data-InShipPlan':planInfo, 'id':(i+1), 'style':[{'css':'background-color', 'value':boxColors[randIndex]}]},
				[
					azlabs.createView(
						'div', {'style':[{'css':'top', 'value':'0'}]}, 
						'<p class="plan-name">' + planName.trunc(13) + '</p>'
					),
					azlabs.createView(
						'img', {'src':'http://' + window.location.hostname + '/wp-content/plugins/AZlabs/assets/img/box.png'}, false
					),
					azlabs.createView(
						'div', {'class':'hidden-box-opt', 'hover-tagID':(i+1)}, 
						[
							azlabs.createView(
								'button', {'class':'btn btn-danger pull-right delete-InShipPlan'},
								'<span class="glyphicon glyphicon-trash"></span>'
							),
							azlabs.createView(
								'button', {'class':'btn btn-primary pull-right edit-InShipPlan'},
								'<span class="glyphicon glyphicon-edit"></span>'
							)
						]
					),
				]
			);

			selector.get('.plans').append($littlePlanBox);

		}// end for

		// bind event...
		selector.get('.InShipPlan-box').hover(
			function(evt) {
				selector.get('div[hover-tagID="' + evt.target.id + '"]', true).animate({'bottom':'0'}, 'fast');
			},
			function(evt) {
				selector.get('.hidden-box-opt', true).animate({'bottom':'-38px'}, 'fast');
			}
		);
		selector.get('.InShipPlan-box').on('click', _boxBtnEvents);

		currentPlanCount = planCount;

		loadingOverlay.off();
	}

	function _boxBtnEvents(evt) {

		var $btn = selector.get(evt.target, true).closest('button'), 
			planData = (selector.get(this, true).attr('data-InShipPlan')).split('|');

		if($btn.hasClass('edit-InShipPlan')) {
			azevents.emit('InShipPlan-onEdit', planData);
		}else if($btn.hasClass('delete-InShipPlan')) {
			_planDelete(planData);
		}

	}

	function _planDelete(planData) {
		// TODO
	}

	function _syncAnInbound() {
		azmodal({
			title : 'Inbound Shipment Sync',
			message : azlabs.createView('div', {'class':'box form-group'},
				'<label for="shipmentIDsyncField">Shipment ID:</label> <input class="form-control" id="shipmentIDsyncField" type="text">'
			),
			action : function() {

				var shipmentID = selector.get('#shipmentIDsyncField', true).val() || false;

				if(shipmentID) {
					loadingOverlay.on();
					azevents.ajaxrequest({
						'action' : 'request_data',
						'modID' : 'module_03',
						'load' : 'syncInboundShipmentFromSellerCentral',
						'args' : {
							'shipmentID' : shipmentID,
						}
					}, function(response) {
						
						if(response) {
							render('refresh');
						}else {
							azmodal({
								title : '<span class="glyphicon glyphicon-alert"></span>Sync error',
								message : 'Shipment ID: ['+shipmentID+']. Not found...',
								action : function() { loadingOverlay.off(); }
							});
						}

					}, false, false);
				}
			}
		});
	}

	return {
		render : render,
	}

})();

/*	
	================================
				MODULE 2
	================================
	Plan Editor...
*/	

(function() {

	var planData;

	// pre-rendered editor view...
	var editorView = azlabs.createView('div', {'class':'col-xs-12 shipment-review-data'},
	[
		azlabs.createView('div', {'class':'row'}, 
		[
			azlabs.createView('div', {'class':'col-xs-6'}, 
			[
				'<b>Shipment Name/ID/Destination</b>',
				azlabs.createView('p', {},
				[
					'<b>Name: <a href="#" id="editor-shipment_name" data-toggle="tooltip" title="Click to rename"></a></b><br>',
					'<b>ID: </b><span id="editor-planID"></span><br>',
					'<b>Destination: </b><span id="editor-dfci"></span>'
				])
			]),
			azlabs.createView('div', {'class':'col-xs-6'},
			[
				'<b>Shipment From</b>',
				azlabs.createView('div', {}, '<div id="editor-reAddress"></div>')
			]),
		]),
		'<p id="separator"></p>',
		azlabs.createView('div', {'class':'row'},
		[
			azlabs.createView('div', {'class':'editor-steps'}, 
			[
				// START: Step 1
				azlabs.createView('div', {'id':'editor-step1'}, 
				[
					'<h3 class="editor-steptitle"><strong>1. Review shipment contents</strong></h3>',
					'<p id="separator"></p>',
					azlabs.createView('div', {'class':'alert alert-info'}, 
						'<span class="glyphicon glyphicon-info-sign"></span> <b>INFO</b> <p>You can review and modify your unit quantity here and can only change quantity by 5% or 6 units. If you want to add more or new products to your shipment, you must duplicate the shipment or create a new shipment. Any quantities entered beyond the allowed range may be subject to additional placement fees.</p>'
					),
					azlabs.createView('button' , {'class':'btn btn-primary', 'id':'editor-item_review'},
						'<span class="loading-img"></span> Review and modify units'			
					),
				]),

				// START: Step 2
				azlabs.createView('div', {'id':'editor-step2'}, 
				[
					'<h3 class="editor-steptitle"><strong>2. Shipping service</strong></h3>',
					'<p id="separator"></p>',
					azlabs.createView('div', {'class':'col-xs-12'},
					[
						azlabs.createView('div', {'class':'col-xs-6'}, 
						[
							'<b>Shipping method</b>',
							azlabs.createView('p', {}, 
								azlabs.createView('div', {'class':'radio'}, 
									azlabs.createView('label', {}, 
									[
										'<input type="radio" class="shippingMethod" name="method" checked="checked" value="SP" style="margin-top:2px;">',
										'<b>Small Parcel delivery (SPD)</b>',
										'<br>I\'m shipping individual boxes'
									])
								)
							),
							azlabs.createView('p', {}, 
								azlabs.createView('div', {'class':'radio'},
									azlabs.createView('label', {}, 
									[
										'<input type="radio" class="shippingMethod" name="method" value="LTL" style="margin-top:2px;">',
										'<b>Less than truckload (LTL)</b>',
										'<br>I\'m shipping pallets; shipment at least 150 lbs.'
									])
								)
							),
						]),
						azlabs.createView('div', {'class':'col-xs-6'}, 
						[
							'<b>Shipping Method</b>',
							azlabs.createView('p', {}, 
								azlabs.createView('div', {'class':'radio'},
									azlabs.createView('label', {},
									[
										'<input type="radio" checked="checked" value="ups" name="carrierType" style="margin-top:2px;">',
										'<b>Amazon-Partnered Carrier (UPS)</b>',
										'<br>Deeply-discounted ground shipping with easy tracking'
									])
								)
							),
						])
					]),
				]),

				// START: Step 3
				azlabs.createView('div', {'id':'editor-step3'}, false),

				// START: Step 4
				azlabs.createView('div', {'id':'editor-step4', 'class':'onEditor-hide'}, false),
	
				// START: Step 5
				azlabs.createView('div', {'id':'editor-step5', 'class':'onEditor-hide'}, 
				[
					'<h3 class="editor-steptitle"><strong>5. Shipping labels</strong></h3>',
					'<p id="separator"></p>',
					azlabs.createView('select', {'id':'pkgLabel'}, 
					[
						'<option value="PackageLabel_Letter_2" selected="selected">PackageLabel_Letter_2</option>',
						'<option value="PackageLabel_Letter_4">PackageLabel_Letter_4</option>',
						'<option value="PackageLabel_Letter_6">PackageLabel_Letter_6</option>',
						'<option value="PackageLabel_A4_2">PackageLabel_A4_2</option>',
						'<option value="PackageLabel_A4_4">PackageLabel_A4_4</option>',
						'<option value="PackageLabel_Plain_Paper">PackageLabel_Plain_Paper</option>'
					]), ' ',
					'<button class="btn btn-primary" id="editor-print-box-labels">Print box labels</button>'
				])

			]), // END: steps container
			azlabs.createView('div', {'class':'row onEditor-hide', 'style':[{'css':'background-color', 'value':'#222222'},{'css':'padding', 'value':'10px'}]}, 
			[
				azlabs.createView('div', {'class':'col-xs-12'}, 
					azlabs.createView('div', {'class':'pull-right'}, '<button class="btn btn-success"><b>Complete shipment <span class="glyphicon glyphicon-play"></span></b></button>')
				)
			])
		])
	]);

	// register to a pub-sub event...
	azevents.on('InShipPlan-onEdit', _render);
	azevents.on('InShipPlan-clearEditor', _editorBuilder);

	function _render(data) {

		planData = data;

		loadingOverlay.on();
		azevents.ajaxrequest({
			'action' : 'request_data',
			'modID' : 'module_03',
			'load' : 'getPlanItems',
			'args' : {
				'planID' : planData[1] // at index 1 is where the plan ID was stored...
			}
		}, _editorBuilder);

	}

	function _editorBuilder(data) {
		
		selector.undef('.shipment-review-data');

		// build additional views to the pre-rendered editor view...
		var view = (data && Array.isArray(data)) ? editorView : '';

		if(view) {

			selector.get('.shipment-review').html(view);
			selector.get('.shipment-review').find('#editor-shipment_name').text(planData[0]);
			selector.get('.shipment-review').find('#editor-planID').text(planData[1]);
			selector.get('.shipment-review').find('#editor-dfci').text(planData[2]);

			addressListModule.render(
				selector.get('.shipment-review').find('#editor-reAddress'),
				planData[3]
			);
			selector.get('.shippingMethod[value="SP"]', true).prop('checked', true);

			// attaching modular views...
			azevents.emit('InShipPlan-itemReview', {
				'planData' : planData,
				'planItems' : data
			});
			// TODO
			azevents.emit('InShipPlan-shippingMethodRender', {
				'planID' : planData[1],
				'parent' : selector.get('#editor-step3')
			});
			azevents.emit('InShipPlan-calculatingShipmentCharge', {
				'planID' : planData[1],
				'parent' : selector.get('#editor-step4')
			});

			// Bind events to some editor elements...
			selector.get('#editor-item_review').on('click', _callShipmentContentReviewer);
			selector.get('.shippingMethod').on('click', _changeShippingMethod);
		}

		loadingOverlay.off();
	}

	function _callShipmentContentReviewer() {
		azevents.emit('InShipPlan-itemReviewCall');
	}

	function _changeShippingMethod(evt) {

		azevents.emit(
			'InShipPlan-shippingMethodChange', 
			$(evt.target).val()
		);

	}

})();

/*
	MODULE 2 ->	Plan Editor Module #1
				NAME: Review and Modify Modal...
*/

(function() {
	
	var planData, planItemInitQty = [], planItemCurrQty = [];
	var planItems = [];

	// caching view...
	var itemEditorTable = // Item table header...
	[
		azlabs.createView('tr', {'id':'itemEditor-itemTable'}, 
		[
			'<td><strong>MSKU</strong></td>',
			'<td><strong>Item name</strong></td>',
			'<td><strong>FNSKU</strong></td>',
			'<td><strong>QTY</strong></td>',
			'<td><strong>Action</strong></td>',
		]
	)];

	// register to a pub-sub event...
	azevents.on('InShipPlan-itemReview', _render);
	azevents.on('InShipPlan-itemReviewCall', _call);

	function _render(data) {

		_destroyEditor();

		planData = data.planData;
		planItems = data.planItems;

		// preparing item edit modal-view...
		for(x in planItems) {

			itemEditorTable.push(
				azlabs.createView('tr', {'data-itemEditID':(parseInt(x) + 1)}, 
				[
					'<td>' + planItems[x].seller_sku + '</td>',
					'<td class="itemEditor-itemName">' + planItems[x].product_name + '</td>',
					'<td class="itemEditor-itemFNSKU">' + planItems[x].fn_sku + '</td>',
					'<td class="itemEditor-qtyEdit"><input type="text" value="' + planItems[x].qty + '"></td>',
					'<td><button class="btn btn-danger itemEditor-itemDelete"><span class="glyphicon glyphicon-trash"></span></button></td>',
				])
			);

			planItemCurrQty.push(parseInt(planItems[x].init_qty));
			planItemInitQty.push(parseInt(planItems[x].init_qty));
		}
	}

	function _call() {

		if(itemEditorTable.length === 1) 
			bootbox.alert('Error: Nothing to display.');

		// View builder...MODAL
		var modalView = azlabs.createView('div', {'class':'scrollable'}, 
			azlabs.createView('table', {'class':'table table-responsive table-striped', 'id':'itemEditor-tableData'}, itemEditorTable)
		);

		bootbox.dialog({
			title : 'Review and Modify',
			className : 'itemEditor-modal',
			message : modalView,
			buttons : {
				main : {
					label : 'Print labels for this page',
					className : 'btn-primary itemEditor-printlabels',
					callback : function() {
						// TODO
						// TODO
					}
				},
				success : {
					label : 'Done',
					className : 'btn-success',
					callback : _editorDoneEvent()
				}
			},
		});

		selector.get('.itemEditor-qtyEdit').find('input').on('keyup', _itemEditorQtyChecker);

	}

	function _itemEditorQtyChecker(evt) {
		
		var $valField = $(evt.target);
		var index = ($(evt.target).parent('.itemEditor-qtyEdit')).parent().attr('data-itemEditID');
		index = (parseInt(index) - 1);

		var val = parseInt($(evt.target).val());
		var oldVal = planItems[index].qty, 
			initQty = planItemInitQty[index], 
			allowedRange = initQty + 6, 
			allowedDeductionRange = initQty - 6;

		if(val != oldVal) {
			
			if(val <= 0 || !val) {
				$valField.val(oldVal);
			}

			var msg = 'The quantity you entered is not within the allowed 5% range. Please enter a value between ';
			msg = (val > allowedRange) ? msg + ' ' + initQty + ' and ' + allowedRange : (val < allowedDeductionRange) ? msg + ' ' + allowedDeductionRange + ' and ' + allowedRange : false;

			if(msg) {
				bootbox.alert(msg);
				$valField.val(oldVal);
			}

			planItemCurrQty[index] = val;
		}

	}

	function _editorDoneEvent() {

		if(_checkQtyChange()) {

			var items = [];
	
			for(i in planItems) {
				items.push({
					'seller_sku' : planItems[i].seller_sku,
					'qty' : planItems[i].qty
				});
			}
	
			azevents.ajaxrequest({
				'action' : 'request_data',
				'modID' : 'module_03',
				'load' : 'modifyItemUnits',
				'args' : {
					'status' : 'WORKING',
					'shipment_id' : planData[1],
					'shipment_name' : planData[0],
					'addrIndex' : planData[3],
					'destination_fulfillment_center_id' : planData[2],
					'items' : items,
				}
			}, function(response) {});

		}
	}

	function _checkQtyChange() {

		var change = false;

		for(i in planItems) {
			if(planItems[i].qty != planItemCurrQty[i]) {
				planItems[i].qty = planItemCurrQty[i];
				change = true;
			}
		}

		return change;

	}

	function _destroyEditor() {

		if(!selector.get('.itemEditor-modal'))	return;

		planData = [];
		planItemInitQty = [];
		planItemCurrQty = [];

		// unbind events...		
		selector.get('.itemEditor-qtyEdit').off('keyup', _itemEditorQtyChecker);

		// detach / remove editor view...
		if(itemEditorTable.length > 1)
			itemEditorTable.splice(1, itemEditorTable.length);

		selector.undef('.itemEditor-modal');

	}

})();

/*
	MODULE 2 ->	Plan Editor Module #2
				NAME: Shipping Method...
*/

(function() {

	var shipmentID, shippingMethod, hasLTLshippingWarnings, boxCount = 0;
	var LTLshipmentPerBoxInfo = [];

	var labels = {
		'PackageLabel_Letter_2' : '<option value="PackageLabel_Letter_2">PackageLabel_Letter_2</option>',
		'PackageLabel_Letter_4' : '<option value="PackageLabel_Letter_4">PackageLabel_Letter_4</option>',
		'PackageLabel_Letter_6' : '<option value="PackageLabel_Letter_6">PackageLabel_Letter_6</option>',
		'PackageLabel_A4_2' : '<option value="PackageLabel_A4_2">PackageLabel_A4_2</option>',
		'PackageLabel_A4_4' : '<option value="PackageLabel_A4_4">PackageLabel_A4_4</option>',
		'PackageLabel_Plain_Paper' : '<option value="PackageLabel_Plain_Paper">PackageLabel_Plain_Paper</option>'
	};
	var view = // Shipping method view...
	[
		'<h3 class="editor-steptitle"><strong>3. Shipment packing</strong></h3>',
		'<p id="separator"></p>',
		// SP Shipping Method...
		azlabs.createView('div', {'id':'method-sp'}, 
		[
			azlabs.createView('div', {'class':'form-group'}, 
			[
				'<label for="editor-boxCountInput">Total # of boxes:</label>',
				'<br><input class="editor-boxCountInput" type="text" maxlength="3">', ' ',
				'<button class="btn btn-primary" id="editor-setBoxes">Set number of boxes</button>'
			]),
			azlabs.createView('div', {'id':'SPshippingMethod-panel'}, 
			[
				azlabs.createView('table', {'class':'table onEditor-hide', 'id':'editor-shippingMethod-SP_tblModel'}, 
					azlabs.createView('tr', {'style':[{'css':'background-color', 'value':'#FFA600'}]}, 
					[
						'<td><b>Box #</b></td>',
						'<td><b>Box weight (lb.)</b></td>',
						'<td><b>Box dimensions (in.)</b></td>',
						'<td><b>Remove</b></td>'
					])
				), '<br>',
			]), 
		]),
		// LTL Shipping method...
		azlabs.createView('div', {'id':'method-ltl', 'class':'onEditor-hide'}, 
		[
			azlabs.createView('table', {'class':'table'}, 
			[
				azlabs.createView('tr', {'style':[{'css':'background-color', 'value':'#FFA600'}]}, 
				[
					'<td><b># of boxes</b></td>', 
					'<td><b># of labels</b></td>', 
					'<td><b>Paper Type</b></td>', 
					'<td><b>Action</b></td>',
				]),
				azlabs.createView('tr', {'style':[{'css':'background-color', 'value':'#494949'}]}, 
				[
					'<td><input type="text" id="editor-LTLboxCount" style="width:50px;"></td>', 
					'<td><input type="text" id="editor-LTLlabelCount" style="width:50px;"></td>', 
					azlabs.createView('td', {}, 
						azlabs.createView('select', {'id':'editor-LTLlabelPaperType'}, 
							_getPaperType([
								'PackageLabel_Letter_6', 
								'PackageLabel_Plain_Paper'
							])
						)
					),
					'<td><button class="btn btn-primary" id="editor-printBoxLabels">Print box labels</button></td>',
				])
			]),
			azlabs.createView('div', {'style':[{'css':'margin-bottom', 'value':'15px'}]}, '<button id="editor-LTLcallBoxInfoModal" class="btn btn-primary onEditor-hide"><span class="glyphicon glyphicon-chevron-right"></span> To Box Information</button>'),
			azlabs.createView('ul', {}, 
			[
				'<li> - Place labels so they don\'t cover box seams.</li>', 
				'<li> - Stack boxes on standard GMA pallets.</li>', 
				'<li> - Pallets must not be built more than 72\" high, including the pallet.</li>', 
				'<li> - Total weight of the pallet must not exceed 1,500 lbs.</li>', 
				'<li> - Securely stretch-wrap each pallet.</li>'
			]), '<br>', 
		]), 
		azlabs.createView('div', {'id':'shipmentBoxOverallInfo'}, false), 
		azlabs.createView('div', {'class':'onEditor-hide shippingMethodAlertMsgContainer'}, 
		[
			'<span class="glyphicon glyphicon-alert"></span> <strong>INFO</strong>',
			azlabs.createView('ul', {'id':'shipmentAlertList'}, false)
		]), '<br>',
		'<button class="btn btn-primary pull-right onEditor-hide" id="editor-btnToStep4">Proceed to Shipping Charges</button>', '<br>',
	];

	// register to a pub-sub event...
	azevents.on('InShipPlan-shippingMethodRender', _render);
	azevents.on('InShipPlan-shippingMethodChange', _setMethod);

	function _render(data) {

		shipmentID = data['planID'];
		data['parent'].html(view);
		_setMethod('SP');

		// bind event...from the pre-rendered view...see parent...
		selector.get('#editor-setBoxes').on('click', _SPmethod);
		selector.get('#editor-LTLcallBoxInfoModal').on('click', _LTLmethod);

		selector.get('#editor-LTLboxCount').on('keyup', function() {
			
			thisVal = parseInt(this.value) || 0;
			selector.get('#editor-LTLlabelCount').val(thisVal);
			
			if(thisVal)
				selector.get('#editor-LTLcallBoxInfoModal').removeClass('onEditor-hide');
			else 
				selector.get('#editor-LTLcallBoxInfoModal').addClass('onEditor-hide');
		});

		selector.get('#editor-btnToStep4', true).on('click', _estimateShippingCost);
		// selector.get('#editor-printBoxLabels').on('click', );
	}

	// rendered view base on Shipment method, Small Parcel Delivery...
	function _SPmethod() {
		
		boxCount = parseInt(selector.get('.editor-boxCountInput').val()) || 0;

		_setMethod('SP', boxCount);

		if(boxCount && !isNaN(boxCount)) {

			// dynamic build view...
			var forSP = azlabs.createView('tr', {'class':'editor-shippingMethod-SP_tblData', 'data-task':'affectAllFields'}, 
			[
				'<td>ALL</td>',
                '<td><input type="text" class="shippingMethod-SPwg"></td>',
                '<td><input type="text" class="shippingMethod-SPl"> L<br><input type="text" class="shippingMethod-SPw"> W<br><input type="text" class="shippingMethod-SPh"> H</td>',
                '<td></td>'
			]);
			var weightExceedLimit = false;

			selector.get('#editor-shippingMethod-SP_tblModel').removeClass('onEditor-hide');

			if(boxCount === 1) {
				
				forSP = azlabs.createView('tr', {'class':'editor-shippingMethod-SP_tblData'}, 
				[
					'<td class="SPbox">1</td>',
	                '<td><input type="text" class="shippingMethod-SPwg"></td>',
	                '<td><input type="text" class="shippingMethod-SPl"> L<br><input type="text" class="shippingMethod-SPw"> W<br><input type="text" class="shippingMethod-SPh"> H</td>',
	                '<td><button class="btn btn-danger shippingBox-remove"><span class="glyphicon glyphicon-remove"></span></button></td>'
				]);

				selector.get('#editor-shippingMethod-SP_tblModel').append(forSP);

			}else if(boxCount >= 2) {

				selector.get('#editor-shippingMethod-SP_tblModel').append(forSP);
				for(var i = 0; i < boxCount; i++) {
					
					selector.get('#editor-shippingMethod-SP_tblModel').append(
						azlabs.createView('tr', {'class':'editor-shippingMethod-SP_tblData'}, 
						[
							'<td class="SPbox">' + (i+1) + '</td>',
			                '<td><input type="text" class="shippingMethod-SPwg"></td>',
			                '<td><input type="text" class="shippingMethod-SPl"> L<br><input type="text" class="shippingMethod-SPw"> W<br><input type="text" class="shippingMethod-SPh"> H</td>',
			                '<td><button class="btn btn-danger shippingBox-remove"><span class="glyphicon glyphicon-remove"></span></button></td>'
						])
					);
				}

			}

			selector.get('#editor-btnToStep4').removeClass('onEditor-hide');

			// bind event...
			selector.get('.editor-shippingMethod-SP_tblData').on('keyup', function(evt) {
				
				var wg = 0, l = 0, w = 0, h = 0;

				if($(this).data('task') == 'affectAllFields') {

					wg = $(this).find('.shippingMethod-SPwg').val();
					l = $(this).find('.shippingMethod-SPl').val();
					w = $(this).find('.shippingMethod-SPw').val();
					h = $(this).find('.shippingMethod-SPh').val();

					selector.get('.editor-shippingMethod-SP_tblData').find('.shippingMethod-SPwg').val(wg);
					selector.get('.editor-shippingMethod-SP_tblData').find('.shippingMethod-SPl').val(l);
					selector.get('.editor-shippingMethod-SP_tblData').find('.shippingMethod-SPw').val(w);
					selector.get('.editor-shippingMethod-SP_tblData').find('.shippingMethod-SPh').val(h);

				}

			});

			selector.get('.shippingMethod-SPwg', true).on('keyup', function() {

				selector.get(this, true).each(function() {
					weightExceedLimit = (parseFloat(this.value) > 50) ? true : false;
				});

				_shippingAlerts(((weightExceedLimit) ? '- Boxes containing more than one unit must not exceed 50 lb. A box containing one unit weighing over 50 lb must be marked “Team Lift” on the top and sides.' : false));

			});

			selector.get('.editor-shippingMethod-SP_tblData', true).find('.shippingBox-remove').on('click', function(evt) {
				
				var $parent = (selector.get(evt.target, true).parent()).parent('.editor-shippingMethod-SP_tblData');
				
				selector.undef($parent);
				
				boxCount = 1;
				selector.get('.SPbox', true).each(function(evt) {
					selector.get(this, true).text(boxCount);
					boxCount++;
				});

				if(!selector.get('.SPbox').length) _setMethod('SP');

			});

			selector.get('.editor-boxCountInput').val('');
		}
	}

	function _LTLmethod() {
		
		boxCount = parseInt(selector.get('#editor-LTLboxCount').val());
		hasLTLshippingWarnings = {};

		var alertView = azlabs.createView();
		var	LTLshipmentInfoView = azlabs.createView('table', {'class':'table'}, 
		[
			azlabs.createView('tr', {}, 
			[
				'<td><b>Total box weight</b></td>',
				'<td><b>Total # of pallets</b></td>',
			]),
			azlabs.createView('tr', {'class':'LTLboxesInfo'}, false),
		]);

		_setMethod('LTL');

		// build view...
		bootbox.dialog({
			title : 'Set LTL/FTL boxes',
			className : 'LTLsetBoxModal',
			message : azlabs.createView('table', {'class':'table','id':'LTLboxModalEditor'}, 
				azlabs.createView('tr', {'style':[{'css':'background-color', 'value':'#FFA600'}]}, 
				[
					'<td><b>Dimensions (in.)</b></td>', 
					'<td><b>Weight (lb.)</b></td>', 
					'<td><b># of pallets</b></td>', 
					'<td><b>Total weight (lb.)</b></td>', 
					'<td><b>Stackable pallets</b></td>', 
					'<td><b>Remove</b></td>'
				])
			),
			buttons : {
				main : {
					label : 'OK',
					className : 'btn btn-primary LTLboxInputConfirm'
				},
			}
		});

		for(var i = 0; i < boxCount; i++) {
			
			selector.get('#LTLboxModalEditor', true).append(
				azlabs.createView('tr', {'id':'LTLboxTblRow', 'style':[{'css':'background-color', 'value':'#494949'},{'css':'color', 'value':'#ffffff'}]}, 
				[
					'<td>48 x 40 x <input class="LTLboxInput" name="LTLboxHeight" value="0" type="text" style="width:35px;"></td>', 
					'<td><input type="text" class="LTLboxInput" name="LTLboxWg" value="0" style="width:50px;"></td>', 
					'<td><input type="text" class="LTLboxInput" name="LTLpalletCount" value="0" style="width:50px;"></td>', 
					'<td class="LTLboxInput" name="LTLtotalWg">0</td>', 
					'<td><input type="checkbox"></td>', 
					'<td><button class="btn btn-danger"><span class="glyphicon glyphicon-remove"></span></button></td>'
				])
			);

			if(LTLshipmentPerBoxInfo.length && LTLshipmentPerBoxInfo[i] !== undefined) {

				selector.get('.LTLboxInput[name="LTLboxHeight"]:eq('+i+')', true).val(LTLshipmentPerBoxInfo[i].boxHeight);
				selector.get('.LTLboxInput[name="LTLboxWg"]:eq('+i+')', true).val(LTLshipmentPerBoxInfo[i].boxWeight);
				selector.get('.LTLboxInput[name="LTLpalletCount"]:eq('+i+')', true).val(LTLshipmentPerBoxInfo[i].palletCount);
				selector.get('.LTLboxInput[name="LTLtotalWg"]:eq('+i+')', true).text(LTLshipmentPerBoxInfo[i].totalBoxWg);

			}

		}

		// Bind Event...
		selector.get('.LTLboxInput', true).on('keyup', function() {
			
			var $parent = (selector.get(this, true).parent()).parent('#LTLboxTblRow'),
				totalWg = 0, palletCount = 0;

			totalWg = parseFloat($parent.find('.LTLboxInput[name="LTLboxWg"]').val()) * parseFloat($parent.find('.LTLboxInput[name="LTLpalletCount"]').val());
			$parent.find('td[name="LTLtotalWg"]').text(totalWg || 0);

		});

		selector.get('.LTLboxInputConfirm', true).on('click', function() {

			LTLshipmentPerBoxInfo = [];

			var totalWg = 0, palletCount = 0;
			
			for(var i = 0; i < boxCount; i++) {

				var perBoxHeight = parseFloat(selector.get('.LTLboxInput[name="LTLboxHeight"]:eq('+i+')', true).val()) || 0,
					perBoxWg = parseFloat(selector.get('.LTLboxInput[name="LTLboxWg"]:eq('+i+')', true).val()) || 0,
					perBoxPallet = parseFloat(selector.get('.LTLboxInput[name="LTLpalletCount"]:eq('+i+')', true).val()) || 0,
					perBoxTotalWg = parseFloat(selector.get('.LTLboxInput[name="LTLtotalWg"]:eq('+i+')', true).text()) || 0;

				totalWg += perBoxTotalWg; 
				palletCount += perBoxPallet;

				if(perBoxWg > 1500)
					hasLTLshippingWarnings['perBoxWgLimit'] = (hasLTLshippingWarnings['perBoxWgLimit'] === undefined) ? '- Please enter a valid weight for each pallet. The maximum weight per pallet is 1500 lbs.' : hasLTLshippingWarnings['perBoxWgLimit'];

				// checks if all inputs are supplied...
				if(!perBoxHeight || !perBoxWg || !perBoxPallet) return false;

				LTLshipmentPerBoxInfo.push({
					'boxHeight' : perBoxHeight,
					'boxWeight' : perBoxWg,
					'palletCount' : perBoxPallet,
					'totalBoxWg' : perBoxTotalWg
				});

			}

			if(totalWg && (totalWg < 150 || totalWg > 40000)) 
				hasLTLshippingWarnings['totalWgLimit'] = (hasLTLshippingWarnings['totalWgLimit'] === undefined) ? '- Please enter a total weight between 150 and 40,000 lb.' : hasLTLshippingWarnings['totalWgLimit'];

			if(palletCount && (palletCount > 26)) 
				hasLTLshippingWarnings['palletLimit'] = (hasLTLshippingWarnings['palletLimit'] === undefined) ? '- Please enter number of pallets between 1 and 26.' : hasLTLshippingWarnings['palletLimit'];

			selector.get(LTLshipmentInfoView).find('.LTLboxesInfo').append('<td><b>' + totalWg + '</b></td>');
			selector.get(LTLshipmentInfoView).find('.LTLboxesInfo').append('<td><b>' + palletCount + '</b></td>');
			selector.get('#shipmentBoxOverallInfo').html(LTLshipmentInfoView);

			hasLTLshippingWarnings = _shippingAlerts(hasLTLshippingWarnings);
			if(!hasLTLshippingWarnings) 
				selector.get('#editor-btnToStep4').removeClass('onEditor-hide');

			return true;

		});

	}

	function _shippingAlerts(alertMsg) {

		var type = typeof alertMsg;

		if(alertMsg && (type === 'string')) {
			selector.get('#shipmentAlertList').html('<li>' + alertMsg + '</li>');
		}else if(Object.keys(alertMsg).length && (type === 'object')) {
			for(i in alertMsg) {
				selector.get('#shipmentAlertList').append('<li>' + alertMsg[i] + '</li>');
			}
		}else {
			selector.get('.shippingMethodAlertMsgContainer').addClass('onEditor-hide');
			selector.get('#shipmentAlertList').empty();
			return false;
		}

		selector.get('.shippingMethodAlertMsgContainer').removeClass('onEditor-hide');
		return true;
	}

	function _estimateShippingCost() {

		if(shippingMethod === 'SP') {
			_estimateShippingCostForSPD();
		}else if(shippingMethod === 'LTL') {
			_estimateShippingCostForLTL();
		}

	}

	function _estimateShippingCostForSPD() {
		
		var clear = true;
		var wg = 0, l = 0, w = 0, h = 0,
			totalWg = 0, shippingData = [];

		var $boxInput = selector.get('.editor-shippingMethod-SP_tblData');

		$boxInput.each(function() {
			
			if(!$(this).data('task')) {
				
				wg = parseFloat($(this).find('.shippingMethod-SPwg').val()) || 0, 
				l = parseFloat($(this).find('.shippingMethod-SPl').val()) || 0, 
				w = parseFloat($(this).find('.shippingMethod-SPw').val()) || 0, 
				h = parseFloat($(this).find('.shippingMethod-SPh').val()) || 0;

				if(!wg || !l || !w || !h) {
					clear = false;
					return;
				}

				shippingData.push({'wgt':wg, 'l':l, 'w':w, 'h':h});
				totalWg += wg;

			}
		});

		if(clear) {
			
			loadingOverlay.on();
			azevents.ajaxrequest({
				'action' : 'request_data',
				'modID' : 'module_03',
				'load' : 'estimateShippingCost',
				'args' : {
					'shipment_method' : selector.get('.shippingMethod:checked', true).val(),
					'shipment_id' : shipmentID,
					'package_input' : shippingData
				}
			}, function(response) {
				
				selector.get('#editor-btnToStep4').addClass('onEditor-hide');
				selector.get('#SPshippingMethod-panel').addClass('onEditor-hide');

				azevents.emit('InShipPlan-calculatingShipmentCharge-viewToggler', {
					'shipmentMethod' : 'SP',
					'boxCount': boxCount,
					'totalWeight' : totalWg,
					'billableWeight' : response.billableWeight
				});

				loadingOverlay.off();
			});
			
		}else {
			
			azevents.emit('InShipPlan-calculatingShipmentCharge-viewToggler', false);
			bootbox.dialog({
				title : '<span class="glyphicon glyphicon-alert"></span> INPUT ERROR',
				className : 'boxInputEditor-modal',
				message : 'Please make sure that all of your box inputs are in correct format.',
				buttons : {main : {label : 'OK'}}
			});
		}

	}

	function _estimateShippingCostForLTL() {
		// TODO
		// TODO
		azevents.emit(
			'InShipPlan-calculatingShipmentCharge-viewToggler', 
			{'shipmentMethod' : 'LTL'}
		);
	}

	// function that refreshes/remove the current editor view & events that were dynamically created...
	// pre-rendered view are restored to their original state...
	function _setMethod(method, setBoxCount) {
		
		shippingMethod = method;

		if(shippingMethod === 'SP') {
			
			selector.get('#method-sp').removeClass('onEditor-hide');
			selector.get('#method-ltl').addClass('onEditor-hide');

		}else if(shippingMethod === 'LTL') {
			
			selector.get('#method-sp').addClass('onEditor-hide');
			selector.get('#method-ltl').removeClass('onEditor-hide');

		}

		selector.get('#SPshippingMethod-panel').removeClass('onEditor-hide');
		if(setBoxCount > 5)
			selector.get('#SPshippingMethod-panel').addClass('scrollable');
		else 
			selector.get('#SPshippingMethod-panel').removeClass('scrollable');

		selector.undef('.editor-shippingMethod-SP_tblData');
		selector.get('#shipmentBoxOverallInfo').empty();
		selector.get('#shipmentAlertList').empty();

		selector.get('#editor-shippingMethod-SP_tblModel').addClass('onEditor-hide');
		_shippingAlerts(false);

		selector.get('#editor-btnToStep4').addClass('onEditor-hide');
		azevents.emit('InShipPlan-calculatingShipmentCharge-viewToggler', false);

	}

	function _getPaperType(options) {
		
		var list = [];

		for(i in options) {
			
			var key = options[i];
			if(labels[key]) 
				list.push(labels[key]);

		}

		return list;
	}

})();

/*
	MODULE 2 ->	Plan Editor Module #3
				NAME: Calculate shipping charges... for Small-Parcel delivery
*/

(function() {

	var shipmentID;
	var view = // Step 4. [VIEW]
	[
		'<h3 class="editor-steptitle"><strong>4. Shipping charges</strong></h3>',
		'<p id="separator"></p>',
		azlabs.createView('table', {'class':'table table-responsive table-striped onEditor-hide', 'id':'fba-shipment-charges-info-SPD'}, 
		[
			azlabs.createView('tr', {}, 
			[
				'<td><b>Shipping Carrier</b></td>',
				'<td><b># of boxes</b></td>',
				'<td><b>Shipment weight</b></td>',
				'<td><b>Billable weight</b></td>',
				'<td><b>Estimated shipping cost</b></td>',
			]),
			azlabs.createView('tr', {},
			[
				'<td name="fba-shipment-carrier-name"></td>',
				'<td name="fba-shipment-boxes"></td>',
				'<td name="fba-shipment-weight"></td>',
				'<td name="fba-shipment-billable-weight"></td>',
				'<td name="fba-shipment-shipping-cost"><button class="btn btn-primary" id="editor-shippingCostCalculate">Calculate</button></td>'
			]),
		]), 
		azlabs.createView('table', {'class':'table table-responsive table-striped onEditor-hide', 'id':'fba-shipment-charges-info-LTL'}, 
		[
			azlabs.createView('tr', {}, 
			[
				'<td><b>Freight ready date*</b></td>',
				'<td><b>Contact person*</b></td>'
			]),
			azlabs.createView('tr', {}, 
			[
				'<td><input type="text" id="LTLfreightReadyDate" data-provide="datepicker"></td>',
				'<td id="LTLcontactPerson">N/A</td>',
			]),
			azlabs.createView('tr', {}, 
			[
				'<td><b>Freight class</b></td>',
				'<td><b>Declared value</b></td>'
			]),
			azlabs.createView('tr', {}, 
			[
				'<td id="LTLfreightClass"></td>',
				'<td>$ <input type="text" id="LTLdeclaredValue"></td>'
			]),
			'<tr><td><b>Fields marked with * are required</b></td></tr>',
		]), '<br>',
		azlabs.createView('div', {'class':'onEditor-hide pull-right', 'id':'SPshipmentTerms'}, 
		[
			'<input class="editor-agree-terms" name="agreeOnTerms" type="checkbox" value="accept">',
			'<a href="#" name="agreeOnTerms">I agree to the terms and conditions</a> ',
			'<button class="btn btn-success disabled" id="editor-shipment-cost-calculate"><span class="loading-img"></span> Accept Charges</button>',
		]),
	];

	azevents.on('InShipPlan-calculatingShipmentCharge', _render);
	azevents.on('InShipPlan-calculatingShipmentCharge-viewToggler', _toggleView);

	function _render(data) {
		
		shipmentID = data['planID'];
		data['parent'].html(view);

		// Bind datePicker options
		selector.get('#LTLfreightReadyDate').datepicker({
			container : '.shipment-review-data',
			dateFormat : 'mm/dd/yyyy',
			startDate : '0d',
			endDate : '+14d',
			todayHighlight : true,
			todayBtn : 'linked'
		});

		// Bind event...
		selector.get('#editor-shippingCostCalculate').on('click', _calculateShipmentCharge);
	}

	function _calculateShipmentCharge() {
		loadingOverlay.on();
		azevents.ajaxrequest({
			'action' : 'request_data',
			'modID' : 'module_03',
			'load' : 'getShippingCharges',
			'args' : {
				'shipment_method' : selector.get('.shippingMethod:checked', true).val(),
				'shipment_id' : shipmentID
			}
		}, _displayShipmentCharge);
	}

	function _displayShipmentCharge(response) {

		var method = response.method;

		if(method === 'SP') {

			selector.get('#editor-shippingCostCalculate').html(
				'<b>$' + response.result.estimated_amount['Value'] + '</b>'
			);
			// TODO

		}else if(method === 'LTL') {
			// TODO
			// TODO
		}
		

		loadingOverlay.off();
	}

	function _toggleView(viewToggle) {
		
		if(viewToggle) {

			selector.get('#editor-step4').removeClass('onEditor-hide');

			if(viewToggle.shipmentMethod == 'SP') {
				
				selector.get('td[name="fba-shipment-carrier-name"]').text('United Parcel Service Inc.');
				selector.get('td[name="fba-shipment-boxes"]').text(viewToggle.boxCount);
				selector.get('td[name="fba-shipment-weight"]').text(viewToggle.totalWeight + ' lb.');
				selector.get('td[name="fba-shipment-billable-weight"]').text(viewToggle.billableWeight + ' lb.');
				selector.get('#editor-shippingCostCalculate').html('Calculate');

				selector.get('#fba-shipment-charges-info-SPD').removeClass('onEditor-hide');
				selector.get('#fba-shipment-charges-info-LTL').addClass('onEditor-hide');

			}else if(viewToggle.shipmentMethod == 'LTL') {
				
				// TODO
				// TODO

				selector.get('#fba-shipment-charges-info-LTL').removeClass('onEditor-hide');
				selector.get('#fba-shipment-charges-info-SPD').addClass('onEditor-hide');

			}

			return;

		}

		selector.get('#editor-step4').addClass('onEditor-hide');
	}

})();