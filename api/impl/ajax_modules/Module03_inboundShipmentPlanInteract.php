<?php

class Module03_inboundShipmentPlanInteract {

	private $db;
	private $amazonAPIservice;

	public function __construct($db, $amazonAPIservice) {
		$this->db = $db;
		$this->amazonAPIservice = $amazonAPIservice;
	}

	public function getPlans() {
		
		// $user_ID = get_current_user_id();
		$user_ID = $this->db->get_row(
			'SELECT id FROM wp_azlabs_preference_storage WHERE preference_name = "current_client"',
			ARRAY_A
		);
		$user_ID = $user_ID['id'];

		if($user_ID) {
			return $this->db->get_results(
				"SELECT shipment_id, shipment_name, destination_fulfillment_center, address_id FROM wp_azlabs_clients_shipment_info WHERE id = ".$user_ID
			);
		}
			
		return false;
	}

	public function getPlanItems($arg) {

		$planID = $arg['planID'];

		return $this->db->get_results(
			"SELECT product_name, seller_sku, fn_sku, qty, init_qty 
			FROM wp_azlabs_clients_shipment_items 
			WHERE shipment_id = '" . $planID . "'", ARRAY_A
		);
	}

	public function modifyItemUnits($args) {

		$address = $this->db->get_row(
			'SELECT * 
			FROM wp_azlabs_address 
			WHERE id = ' . $args['addrIndex'], ARRAY_A
		);

		if($address) {

			$shipmentInfo = array(
				'status' => $args['status'],
				'shipment_id' => $args['shipment_id'],
				'shipment_name' => $args['shipment_name'],
				'destination_fulfillment_center_id' => $args['destination_fulfillment_center'],
				'address' => $address,
				'items' => $args['items']
			);

			return $this->amazonAPIservice->accessAPI(
				AmazonAPIservice::UPDATE_SHIPMENT_ITEM,
				$shipmentInfo
			);
			
		}

		return false;
		
	}

	public function estimateShippingCost($args) {
		
		$billableWgt = 0;
		$totalWgt = 0;

		$shipmentData = array(
			'shipment_id' => $args['shipment_id'],
			'shipment_method' => $args['shipment_method'],
			'package_input' => $args['package_input']
		);

		foreach ($args['package_input'] as $pkgInput) {
			$billableWgt += ceil(($pkgInput['l'] * $pkgInput['w'] * $pkgInput['h']) / 166);
			$totalWgt += $pkgInput['wgt'];
		}

		$billableWgt = ($totalWgt >= $billableWgt) ? $totalWgt : $billableWgt;

		$request = $this->amazonAPIservice->accessAPI(
			AmazonAPIservice::PUT_TRANSPORT_CONTENT,
			$shipmentData
		);

		if(!$request)
			return false;

		return array(
			'billableWeight' => $billableWgt,
		);
	}

	public function getShippingCharges($args) {

		$response = false;
		$method = $args['shipment_method'];

		if($args['shipment_method'] == 'SP') {
			$shippingData = array(
				'shipment_id' => $args['shipment_id'],
				'shipment_method' => $method
			);


			$response = $this->amazonAPIservice->accessAPI(
				AmazonAPIservice::ESTIMATE_SHIPPING_COST,
				$shippingData
			);

		}elseif($args['shipment_method'] == 'LTL') {
			// TODO
			// TODO
		}

		if($response)
			return array(
				'method' => $method,
				'result' => $response
			);

		return false;
	}

	public function syncInboundShipmentFromSellerCentral($arg) {

		// check shipmentID in database if it's already there...
		$IDcheck = $this->db->get_row(
			'SELECT id FROM wp_azlabs_clients_shipment_info WHERE shipment_id = "'.$arg['shipmentID'].'"',
			ARRAY_A
		);

		$response = $this->amazonAPIservice->accessAPI(
			AmazonAPIservice::LIST_INBOUND_SHIPMENT,
			$arg['shipmentID']
		);

		$inboundShipmentInfo = false;
		$inboundShipmentItems = false;
		
		if($response) {

			$inboundShipmentInfo = $response['inboundShipmentInfo'];
			$inboundShipmentItems = $response['inboundShipmentItems']->member;

			if(!$IDcheck['id']) {

				$this->db->query('START TRANSACTION');

				$res1 = $this->db->insert(
					'wp_azlabs_clients_shipment_info',
					array(
						'id' => SelltecClient::getInstance()->getClientID(),
						'shipment_id' => $inboundShipmentInfo->ShipmentId,
						'shipment_name' => $inboundShipmentInfo->ShipmentName,
						'destination_fulfillment_center' => $inboundShipmentInfo->DestinationFulfillmentCenterId,
						'label_prep_type' => $inboundShipmentInfo->LabelPrepType,
						'status' => $inboundShipmentInfo->ShipmentStatus,
						'address_id' => 1
					)
				);
	
				if(count($inboundShipmentItems) > 1) {

					$itemCount = count($inboundShipmentItems);

					for ($i=0; $i < $itemCount; $i++) { 
						$res2 = $this->db->insert(
							'wp_azlabs_clients_shipment_items',
							array(
								'shipment_id' => $inboundShipmentItems[$i]->ShipmentId,
								'product_name' => '--unretrievable by synching from SellerCentral--',
								'seller_sku' => $inboundShipmentItems[$i]->SellerSKU,
								'fn_sku' => $inboundShipmentItems[$i]->FulfillmentNetworkSKU,
								'qty' => $inboundShipmentItems[$i]->QuantityShipped,
								'init_qty' => $inboundShipmentItems[$i]->QuantityShipped,
							)
						);

						if(!$res2) break;
					}

				}else {
					$res2 = $this->db->insert(
						'wp_azlabs_clients_shipment_items',
						array(
							'shipment_id' => $inboundShipmentItems->ShipmentId,
							'product_name' => '--unretrievable by synching from SellerCentral--',
							'seller_sku' => $inboundShipmentItems->SellerSKU,
							'fn_sku' => $inboundShipmentItems->FulfillmentNetworkSKU,
							'qty' => $inboundShipmentItems->QuantityShipped,
							'init_qty' => $inboundShipmentItems->QuantityShipped
						)
					);
				}

				if(!$res1 || !$res2) {
					$this->db->query('ROLLBACK');
					return false;
				}

				$this->db->query('COMMIT');

			}elseif($IDcheck['id']) {

				$this->db->update(
					'wp_azlabs_clients_shipment_info',
					array(
						'shipment_name' => $inboundShipmentInfo->ShipmentName,
						'label_prep_type' => $inboundShipmentInfo->LabelPrepType,
						'status' => $inboundShipmentInfo->ShipmentStatus,
					),
					array(
						'id' => SelltecClient::getInstance()->getClientID(),
						'shipment_id' => $inboundShipmentInfo->ShipmentId,
					)
				);
	
				if(count($inboundShipmentItems) > 1) {

					$itemCount = count($inboundShipmentItems);

					for ($i=0; $i < $itemCount; $i++) { 
						$this->db->update(
							'wp_azlabs_clients_shipment_items',
							array('qty' => $inboundShipmentItems[$i]->QuantityShipped),
							array(
								'shipment_id' => $inboundShipmentItems[$i]->ShipmentId,
								'seller_sku' => $inboundShipmentItems[$i]->SellerSKU
							)
						);
					}

				}else {
					$this->db->update(
						'wp_azlabs_clients_shipment_items',
						array('qty' => $inboundShipmentItems->QuantityShipped),
						array(
							'shipment_id' => $inboundShipmentItems->ShipmentId,
							'seller_sku' => $inboundShipmentItems->SellerSKU
						)
					);
				}
			}

			return $inboundShipmentInfo;
		}

		return false;
	}

}

?>