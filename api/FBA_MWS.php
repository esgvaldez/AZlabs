<?php

require_once dirname(__FILE__).'/.config.php';

class FBA_MWS extends APIClassLoader {

	private $createInboundShipmentPlanRequest;
	private $createInboundShipmentRequest;
	private $inboundShipmentPlanRequestItemList;

	private $putTransportContent;

	private $exceptionClassHandler;

	public function __construct() {

		parent::__construct('FBAInboundServiceMWS', __FILE__);
		$this->exceptionClassHandler = 'FBAInboundServiceMWS';

		// CREATE or UPDATE INBOUND SHIPMENT...
		$this->APILoader('FBAInboundServiceMWS_Model_CreateInboundShipmentPlanRequest', __FILE__);
		$this->APILoader('FBAInboundServiceMWS_Model_CreateInboundShipmentRequest', __FILE__);
		$this->APILoader('FBAInboundServiceMWS_Model_UpdateInboundShipmentRequest', __FILE__);
		$this->APILoader('FBAInboundServiceMWS_Model_Address', __FILE__);
		$this->APILoader('FBAInboundServiceMWS_Model_InboundShipmentPlanRequestItemList', __FILE__);
		$this->APILoader('FBAInboundServiceMWS_Model_InboundShipmentPlanRequestItem', __FILE__);
		$this->APILoader('FBAInboundServiceMWS_Model_InboundShipmentItemList', __FILE__);
		$this->APILoader('FBAInboundServiceMWS_Model_InboundShipmentItem', __FILE__);
		$this->APILoader('FBAInboundServiceMWS_Model_InboundShipmentHeader', __FILE__);
		$this->APILoader('FBAInboundServiceMWS_Model_PutTransportContentRequest', __FILE__);

		// LIST INBOUND SHIPMENT...
		$this->APILoader('FBAInboundServiceMWS_Model_ListInboundShipmentsRequest', __FILE__);
		$this->APILoader('FBAInboundServiceMWS_Model_ListInboundShipmentItemsRequest', __FILE__);
		$this->APILoader('FBAInboundServiceMWS_Model_ShipmentIdList', __FILE__);

		// SPD (INBOUND SHIPMENT)
		$this->APILoader('FBAInboundServiceMWS_Model_TransportDetailInput', __FILE__);
		$this->APILoader('FBAInboundServiceMWS_Model_PartneredSmallParcelDataInput', __FILE__);
		$this->APILoader('FBAInboundServiceMWS_Model_PartneredSmallParcelPackageInputList', __FILE__);
		$this->APILoader('FBAInboundServiceMWS_Model_PartneredSmallParcelPackageInput', __FILE__);
		$this->APILoader('FBAInboundServiceMWS_Model_Dimensions', __FILE__);
		$this->APILoader('FBAInboundServiceMWS_Model_Weight', __FILE__);

		// LTL (INBOUND SHIPMENT)
		$this->APILoader('FBAInboundServiceMWS_Model_PartneredLtlDataInput', __FILE__);
		$this->APILoader('FBAInboundServiceMWS_Model_Contact', __FILE__);
		$this->APILoader('FBAInboundServiceMWS_Model_EstimateTransportInputRequest', __FILE__);
		$this->APILoader('FBAInboundServiceMWS_Model_GetTransportContentRequest', __FILE__);
		$this->APILoader('FBAInboundServiceMWS_Model_ConfirmTransportInputRequest', __FILE__);

		// VOID INBOUND SHIPMENT...
		$this->APILoader('FBAInboundServiceMWS_Model_VoidTransportInputRequest', __FILE__);

		$this->createInboundShipmentPlanRequest = new FBAInboundServiceMWS_Model_CreateInboundShipmentPlanRequest();
		$this->inboundShipmentPlanRequestItemList = new FBAInboundServiceMWS_Model_InboundShipmentPlanRequestItemList();
		$this->createInboundShipmentRequest = new FBAInboundServiceMWS_Model_CreateInboundShipmentRequest();
		$this->putTransportContent = new FBAInboundServiceMWS_Model_PutTransportContentRequest();
		
	}

	// @Override
	public function init($merchantID, $marketplaceID, $apiKeys, $serviceRegion, $mwsAuthToken = null) {

		parent::init($merchantID, $marketplaceID, $apiKeys, $serviceRegion, $mwsAuthToken);
		$this->service = new FBAInboundServiceMWS_Client(
	        $apiKeys['AWS_ACCESS_KEY_ID'],
	        $apiKeys['AWS_SECRET_ACCESS_KEY'],
	        $this->appName,
	        $this->appVersion,
	        $this->config
        );
	}

	public function itemLookup($asin) {

		global $wpdb;
		if(!$asin) return false;

		$result = array();
		$response = $this->amazonEcs->responseGroup('Medium')->lookup($asin);

		if($response) {
			$responseItems = $response['Items'];
			foreach ($responseItems as $key => $value) {
				$request = $responseItems[$key];
				
				if($key == 'Item') {
					$result['Item'] = array(
						'DetailPageURL' => $value['DetailPageURL'],
						'Image' => $value['MediumImage']['URL'],
						'Title' => $value['ItemAttributes']['Title'],
						'Author' => $value['ItemAttributes']['Author'],
						'Manufacturer' => $value['ItemAttributes']['Manufacturer'],
						'ProductGroup' => $value['ItemAttributes']['ProductGroup']
					);

					$matchSKUs = $wpdb->get_results(
						"SELECT seller_sku, total_supply_qty FROM wp_azlabs_clients_product_listings WHERE client_id = ".get_current_user_id()." AND asin = '".$asin."'",
						ARRAY_A
					);

					if($matchSKUs)
						$result['Skus'] = $matchSKUs;

				}elseif($key == 'Request' && !$value['IsValid']) {
					$errorCode = $value['Errors']['Error']['Code'];
					$errorMsg = $value['Errors']['Error']['Message'];

					return 'Error Code: '.$errorCode.'<br>'.'Error Message: '.$errorMsg;
				}
			}

		}
		return $result;
	}

	/* ========= CREATING INBOUND SHIPMENT ========= */

	/**
	Step 1
	*/
	public function createInboundShipmentPlan($planName, $planData, $address) {

		$this->createInboundShipmentPlanRequest->setSellerId($this->merchantID);

		if($this->mwsAuthToken)
			$this->createInboundShipmentPlanRequest->setMWSAuthToken($this->mwsAuthToken);

		$inboundAddress = new FBAInboundServiceMWS_Model_Address();
		$inboundAddress->setName($address['address_name']);
		$inboundAddress->setAddressLine1($address['address_line_1']);
		$inboundAddress->setAddressLine2($address['address_line_2']);
		$inboundAddress->setDistrictOrCounty($address['district_or_country']);
		$inboundAddress->setCity($address['city']);
		$inboundAddress->setStateOrProvinceCode($address['state_or_province']);
		$inboundAddress->setCountryCode($address['country_code']);
		$inboundAddress->setPostalCode($address['postal_code']);
		$this->createInboundShipmentPlanRequest->setShipFromAddress($inboundAddress);

		$array = array();
		$itemName = array();
		foreach($planData as $data) {
			$inboundShipmentPlanRequestItem = new FBAInboundServiceMWS_Model_InboundShipmentPlanRequestItem() ;
			$inboundShipmentPlanRequestItem->setSellerSKU($data['msku']);
			$inboundShipmentPlanRequestItem->setQuantity($data['qty']);
			$itemName[] = $data['itemName'];

			$array[] = $inboundShipmentPlanRequestItem;
		}

		$this->inboundShipmentPlanRequestItemList->setmember($array);
		$this->createInboundShipmentPlanRequest->setInboundShipmentPlanRequestItems($this->inboundShipmentPlanRequestItemList);
		
		if($this->service) {

			$response = parent::processRequest(
				$this->service,
				'createInboundShipmentPlan',
				$this->createInboundShipmentPlanRequest
			);

			if($response) {

				$shipmentID = $response->CreateInboundShipmentPlanResult->InboundShipmentPlans->member->ShipmentId;
				$destinationFulfillmentCenterId = $response->CreateInboundShipmentPlanResult->InboundShipmentPlans->member->DestinationFulfillmentCenterId;
				$labelPrepType = $response->CreateInboundShipmentPlanResult->InboundShipmentPlans->member->LabelPrepType;
				
				$items = $response->CreateInboundShipmentPlanResult->InboundShipmentPlans->member->Items->member;
				$item = array();
				foreach ($items as $member) {
					$item[] = $member;
				}

				$response = $this->createInboundShipment(
					array(
						'planName'=>$planName,
						'shipmentID'=>$shipmentID,
						'destinationFulfillmentCenterId'=>$destinationFulfillmentCenterId,
						'labelPrepPreference'=>$labelPrepType,
						'itemName'=>$itemName,
						'items'=>$item,
						'address'=>$address
					)
				);

				if($response) 
					return $response->CreateInboundShipmentResult->ShipmentId;
			}
		}

		return false;
	}

	/**
	Step 2
	*/
	public function createInboundShipment($data = array()) {

		$response = false;

		$this->createInboundShipmentRequest->setSellerId($this->merchantID);

		if($this->mwsAuthToken)
			$this->createInboundShipmentRequest->setMWSAuthToken($this->mwsAuthToken);

		$this->createInboundShipmentRequest->setShipmentId($data['shipmentID']);

		$header = new FBAInboundServiceMWS_Model_InboundShipmentHeader();
		$header->setShipmentName($data['planName']);
		$header->setDestinationFulfillmentCenterId($data['destinationFulfillmentCenterId']);//destinationFulfillmentCenterId
		$header->setAreCasesRequired(false);
		$header->setShipmentStatus("WORKING");
		$header->setLabelPrepPreference($data['labelPrepPreference']);

		$Address = new FBAInboundServiceMWS_Model_Address();
		$Address->setName($data['address']['address_name']);
		$Address->setAddressLine1($data['address']['address_line_1']);
		$Address->setAddressLine2($data['address']['address_line_2']);
		$Address->setDistrictOrCounty($data['address']['district_or_country']);
		$Address->setCity($data['address']['city']);
		$Address->setStateOrProvinceCode($data['address']['state_or_province']);
		$Address->setCountryCode($data['address']['country_code']);
		$Address->setPostalCode($data['address']['postal_code']);

		$header->setShipFromAddress($Address);
		$this->createInboundShipmentRequest->setInboundShipmentHeader($header);

		$items = new FBAInboundServiceMWS_Model_InboundShipmentItemList();
		$memberArray = array();
		foreach ($data['items'] as $item) {
			$shipmentItem = new FBAInboundServiceMWS_Model_InboundShipmentItem();
			$shipmentItem->setShipmentId($data['shipmentID']);
			$shipmentItem->setSellerSKU($item->SellerSKU);
			$shipmentItem->setQuantityShipped($item->Quantity);
			
			$memberArray[] = $shipmentItem;
		}

		$items->setmember($memberArray);
		$this->createInboundShipmentRequest->setInboundShipmentItems($items);

		$response = parent::processRequest(
			$this->service,
			'createInboundShipment',
			$this->createInboundShipmentRequest
		);

		if($response) {
			$this->_saveInboundItems(
				get_current_user_id(), 
				$data['shipmentID'], 
				$data['planName'], 
				$data['destinationFulfillmentCenterId'],
				$data['labelPrepPreference'],
				$data['itemName'],
				$data['items'],
				$data['address']
			);
		}

		return $response;
	}

	/**
	step 3
	*/
	public function putTransportContent($data = array()) {

		$this->putTransportContent->setSellerId($this->merchantID);

		if($this->mwsAuthToken)
			$this->putTransportContent->setMWSAuthToken($this->mwsAuthToken);

		$this->putTransportContent->setShipmentId($data['shipment_id']);

		$this->putTransportContent->setIsPartnered(true);
		$this->putTransportContent->setShipmentType($data['shipment_method']);

		$transportDetailInput = new FBAInboundServiceMWS_Model_TransportDetailInput();

		$memberArray = array();
		if($data['shipment_method'] == 'SP') {
			
			$detailData = new FBAInboundServiceMWS_Model_PartneredSmallParcelDataInput();
			$spInputList = new FBAInboundServiceMWS_Model_PartneredSmallParcelPackageInputList();

			foreach ($data['package_input'] as $packageInput) {
				$spInput = new FBAInboundServiceMWS_Model_PartneredSmallParcelPackageInput();
				$dimension = new FBAInboundServiceMWS_Model_Dimensions();
				$weight = new FBAInboundServiceMWS_Model_Weight();

				$dimension->setUnit('inches');
				$dimension->setLength($packageInput['l']);
				$dimension->setWidth($packageInput['w']);
				$dimension->setHeight($packageInput['h']);
				$spInput->setDimensions($dimension);

				$weight->setUnit('pounds');
				$weight->setValue($packageInput['wgt']);
				$spInput->setWeight($weight);

				$memberArray[] = $spInput;
			}

			$spInputList->setmember($memberArray);
			$detailData->setPackageList($spInputList);
			$transportDetailInput->setPartneredSmallParcelData($detailData);

		}elseif($data['shipment_method'] == 'LTL') {
			
			// $detailData = new FBAInboundServiceMWS_Model_PartneredLtlDataInput();

			// $contact = new FBAInboundServiceMWS_Model_Contact();
			// $contact->setEmail($value);
			// $contact->setFax($value);
			// $contact->setName($value);
			// $contact->setPhone($value);

			// $detailData->setContact($contact);
			// $detailData->setBoxCount($value);
			// $detailData->setFreightReadyDate($value);

			// $transportDetailInput->setPartneredLtlData($detailData);
		}

		$this->putTransportContent->setTransportDetails($transportDetailInput);

		$response = parent::processRequest(
			$this->service,
			'putTransportContent',
			$this->putTransportContent
		);

		if($response) {
			
			$status = $response->PutTransportContentResult->TransportResult->TransportStatus;

			if($status == 'WORKING') {
				
				$estimateTransportRequest = new FBAInboundServiceMWS_Model_EstimateTransportInputRequest();
				$estimateTransportRequest->setSellerId($this->merchantID);
				$estimateTransportRequest->setShipmentId($data['shipment_id']);

				$response = parent::processRequest(
					$this->service,
					'estimateTransportRequest',
					$estimateTransportRequest
				);

				if($response) {
					$status = $response->EstimateTransportRequestResult->TransportResult->TransportStatus;
					if($status == 'ESTIMATING') return true;
				}
			}

		}

		return false;
	}

	/**
	step 4
	*/
	public function getEstimatedShippingCost($data) {
		
		$result = false;
		$getTransportContent = new FBAInboundServiceMWS_Model_GetTransportContentRequest();
		$getTransportContent->setSellerId($this->merchantID);
		
		if($this->mwsAuthToken)
			$getTransportContent->setMWSAuthToken($this->mwsAuthToken);

		$getTransportContent->setShipmentId($data['shipment_id']);

		$response = parent::processRequest(
			$this->service,
			'getTransportContent',
			$getTransportContent
		);

		if($response) {
			$result = array();
			if($data['shipment_method'] == 'SP') {

				$result['estimated_amount'] = $response->GetTransportContentResult->TransportContent->TransportDetails->PartneredSmallParcelData->PartneredEstimate->Amount;
				// $result['carrier_name'] = $response->GetTransportContentResult->TransportContent->TransportDetails->PartneredSmallParcelData->PackageList->CarrierName;

			}elseif($data['shipment_method'] == 'LTL') {
				// TODO
				// TODO
				// TODO
			}
		}

		return $result;
	}

	/**
	step 5
	*/
	public function confirmTransportRequest($shipmentID) {
		$result = false;
		$confirmTransportRequest = new FBAInboundServiceMWS_Model_ConfirmTransportInputRequest();
		$confirmTransportRequest->setSellerId($this->merchantID);

		if($this->mwsAuthToken)
			$confirmTransportRequest->setMWSAuthToken($this->mwsAuthToken);

		$confirmTransportRequest->setShipmentId($shipmentID);

		$response = parent::processRequest(
			$this->service,
			'confirmTransportRequest',
			$confirmTransportRequest
		);

		if($response) {
			$status = $response->ConfirmTransportRequestResult->TransportResult->TransportStatus;
			if($status == 'CONFIRMING' || $status == 'CONFIRMED') {
				$result['status'] = $status;
			}
		}

		return $result;
	}

	/**
	MISC: Void Transport request...
	*/
	public function voidTransportRequest() {
		
		$voidTransport = new FBAInboundServiceMWS_Model_VoidTransportInputRequest();
		$voidTransport->setSellerId($this->merchantID);

		if($this->mwsAuthToken)
			$voidTransport->setMWSAuthToken($this->mwsAuthToken);

		$voidTransport->setShipmentId($data['shipment_id']);

		$response = parent::processRequest(
			$this->service,
			'voidTransportRequest',
			$voidTransport
		);

		if($response) {
			$status = $response->VoidTransportRequestResult->TransportResult->TransportStatus;
			if($status == 'VOIDING' || $status == 'VOIDED') {
				return true;
			}
		}

		return false;
	}

	/**
	MISC: Update Inbound Shipment
	*/
	public function updateInboundShipment($shipmentData) {
		
		global $wpdb;
		$response = false;

		$updateInboundShipment = new FBAInboundServiceMWS_Model_UpdateInboundShipmentRequest();

		$updateInboundShipment->setSellerId($this->merchantID);

		if($this->mwsAuthToken)
			$updateInboundShipment->setMWSAuthToken($this->mwsAuthToken);

		$updateInboundShipment->setShipmentId($shipmentData['shipment_id']);

		$header = new FBAInboundServiceMWS_Model_InboundShipmentHeader();
		$header->setShipmentName($shipmentData['shipment_name']);
		$header->setDestinationFulfillmentCenterId($shipmentData['destination_fulfillment_center_id']);//destinationFulfillmentCenterId
		
		$header->setAreCasesRequired(false);
		$header->setShipmentStatus($shipmentData['status']);
		$header->setLabelPrepPreference("SELLER_LABEL");

		$Address = new FBAInboundServiceMWS_Model_Address();
		$Address->setName($shipmentData['address']['address_name']);
		$Address->setAddressLine1($shipmentData['address']['address_line_1']);
		$Address->setAddressLine2($shipmentData['address']['address_line_2']);
		$Address->setDistrictOrCounty($shipmentData['address']['district_or_country']);
		$Address->setCity($shipmentData['address']['city']);
		$Address->setStateOrProvinceCode($shipmentData['address']['state_or_province']);
		$Address->setCountryCode($shipmentData['address']['country_code']);
		$Address->setPostalCode($shipmentData['address']['postal_code']);

		$header->setShipFromAddress($Address);
		$updateInboundShipment->setInboundShipmentHeader($header);

		$items = new FBAInboundServiceMWS_Model_InboundShipmentItemList();
		$memberArray = array();
		foreach ($shipmentData['items'] as $item) {
			$shipmentItem = new FBAInboundServiceMWS_Model_InboundShipmentItem();
			$shipmentItem->setShipmentId($shipmentData['shipment_id']);
			$shipmentItem->setSellerSKU($item['seller_sku']);
			$shipmentItem->setQuantityShipped($item['qty']);

			if($item['qty'] > 0 && $shipmentData['status'] == 'WORKING') {
				$wpdb->update(
					'wp_azlabs_clients_shipment_items',
					array('qty' => $item['qty']),
					array(
						'shipment_id' => $shipmentData['shipment_id'], 
						'seller_sku' => $item['seller_sku']
					)
				);
			}elseif($item['qty'] == 0 && $shipmentData['status'] == 'WORKING') {
				$wpdb->delete(
					'wp_azlabs_clients_shipment_items',
					array(
						'shipment_id' => $shipmentData['shipment_id'], 
						'seller_sku' => $item['seller_sku']
					)
				);
			}
			
			$memberArray[] = $shipmentItem;
		}

		$items->setmember($memberArray);
		$updateInboundShipment->setInboundShipmentItems($items);

		$response = parent::processRequest(
			$this->service,
			'updateInboundShipment',
			$updateInboundShipment
		);

		$shipmentID = $response->UpdateInboundShipmentResult->ShipmentId;
		if($shipmentID == $shipmentData['shipment_id']) {

			// $hasShipmentItems = $wpdb->get_row(
			// 	'SELECT 1 
			// 	FROM wp_azlabs_clients_shipment_items 
			// 	WHERE shipment_id = "' . $shipmentID . '"'
			// );

			// if(!$hasShipmentItems) {
			// 	$wpdb->delete(
			// 		'wp_azlabs_clients_shipment_info',
			// 		array(
			// 			'shipment_id' => $shipmentID
			// 		)
			// 	);
			// }

			return $shipmentID;
		}

		return false;
	}

	public function listInboundShipment($shipmentID) {
		
		if($shipmentID) {
			
			$listInboundShipment = new FBAInboundServiceMWS_Model_ListInboundShipmentsRequest();
			$listInboundShipment->setSellerId($this->merchantID);

			if($this->mwsAuthToken)
				$listInboundShipment->setMWSAuthToken($this->mwsAuthToken);

			$idListMember = new FBAInboundServiceMWS_Model_ShipmentIdList();
			$idListMember->setmember(array($shipmentID));

			$listInboundShipment->setShipmentIdList($idListMember);

			$inboundShipmentData = parent::processRequest(
				$this->service,
				'listInboundShipments',
				$listInboundShipment
			);

			$inboundShipmentData = $inboundShipmentData->ListInboundShipmentsResult->ShipmentData->member;
			if($inboundShipmentData) {
				
				$listInboundShipmentItems = new FBAInboundServiceMWS_Model_ListInboundShipmentItemsRequest();
				$listInboundShipmentItems->setSellerId($this->merchantID);

				if($this->mwsAuthToken)
					$listInboundShipmentItems->setMWSAuthToken($this->mwsAuthToken);

				$listInboundShipmentItems->setShipmentId($shipmentID);

				$inboundShipmentItems = parent::processRequest(
					$this->service,
					'listInboundShipmentItems',
					$listInboundShipmentItems
				);

				$inboundShipmentItems = $inboundShipmentItems->ListInboundShipmentItemsResult->ItemData;
				if($inboundShipmentItems) {
					return array(
						'inboundShipmentInfo' => $inboundShipmentData,
						'inboundShipmentItems' => $inboundShipmentItems,
					);
				}
			}

		}

		return false;
	}

	/* ===== END OF CREATING INBOUND SHIPMENT ===== */

	// Save Inbound Shipment Info...
	private function _saveInboundItems($userID, $shipmentID, $shipmentName, $destinationFulfillmentCenterId, $labelPrepType, $productName, $shippedItems, $address) {
		global $wpdb;

		$wpdb->query('START TRANSACTION');
		
		$q1 = $wpdb->insert(
			'wp_azlabs_clients_shipment_info',
			array(
				'id'=>$userID,
				'shipment_id'=>$shipmentID,
				'shipment_name'=>$shipmentName,
				'destination_fulfillment_center'=>$destinationFulfillmentCenterId,
				'label_prep_type'=>$labelPrepType,
				'address_id'=>$address['id']
			)
		);

		$i = 0;
		foreach ($shippedItems as $item) {
			$q2 = $wpdb->insert(
				'wp_azlabs_clients_shipment_items',
				array(
					'shipment_id'=>$shipmentID,
					'product_name'=>$productName[$i],
					'seller_sku'=>$item->SellerSKU,
					'fn_sku'=>$item->FulfillmentNetworkSKU,
					'qty'=>$item->Quantity,
					'init_qty'=>$item->Quantity
				)
			);

			if(!$q2) break;
			$i++;
		}

		if(!$q1 || !$q2) {
			$wpdb->query('ROLLBACK');
			return false;	
		}

		$wpdb->query('COMMIT');
		return true;

	}

}

?>