<?php

class Module01_createInboundShipmentPlan {

	private $db;
	private $amazonAPIservice;

	public function __construct($db, $amazonAPIservice) {
		// pass database referrence to refrain calling the global variable...
		$this->db = $db;
		$this->amazonAPIservice = $amazonAPIservice;
	}

	public function ShipmentFrom_AddressList() {
		// Retrieve Address List of Inbound Shipment origin...
		return $this->db->get_results(
			"SELECT * FROM wp_azlabs_address", 
			ARRAY_A
		);
	}

	public function ItemLookup($arg) {

		if(!$this->amazonAPIservice) return false;

		return $this->amazonAPIservice->accessAPI(
			AmazonAPIservice::ITEM_LOOKUP, $arg['ASIN']
		);
	}

	public function SaveInboundShipmentPlan($args) {

		$planName = $args['planName'];
		$planData = $args['planData'];
		$pickupAddrIndex = $args['pickupAddrIndex'];

		$addr = $this->db->get_row(
			"SELECT * FROM wp_azlabs_address WHERE id = ".$pickupAddrIndex, 
			ARRAY_A
		);

		if($addr) {
			return $this->amazonAPIservice->accessAPI(
				AmazonAPIservice::CREATE_INBOUND_SHIPMENT_PLAN,
				array(
					'planName'=>$planName,
					'planData'=>$planData, 
					'pickupAddress'=>$addr
				)
			);
		}

		return false;
	}

	public function invTest() {
		return $this->amazonAPIservice->accessAPI(AmazonAPIservice::INVENTORY_SUPPLY_LIST);
	}

}

?>