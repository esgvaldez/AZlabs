<?php

class MWS_FulfillmentInventory extends APIClassLoader {

	private $inventorySupplyRequest;
	private $inventorySupplyRequestNextToken;

	public function __construct() {

		parent::__construct('FBAInventoryServiceMWS',__FILE__);

		$this->APILoader('FBAInventoryServiceMWS_Model_ListInventorySupplyRequest', __FILE__);
		$this->APILoader('FBAInventoryServiceMWS_Model_ListInventorySupplyByNextTokenRequest', __FILE__);
		
		$this->inventorySupplyRequest = new FBAInventoryServiceMWS_Model_ListInventorySupplyRequest();
		$this->inventorySupplyRequestNextToken	= new FBAInventoryServiceMWS_Model_ListInventorySupplyByNextTokenRequest();
	}

	// @Override
	public function init($merchantID, $marketplaceID, $apiKeys, $serviceRegion, $mwsAuthToken = null) {

		parent::init($merchantID, $marketplaceID, $apiKeys, $serviceRegion, $mwsAuthToken);
		$this->service = new FBAInventoryServiceMWS_Client(
	        $apiKeys['AWS_ACCESS_KEY_ID'],
	        $apiKeys['AWS_SECRET_ACCESS_KEY'],
	        $this->config,
	        $this->appName,
	        $this->appVersion
        );

	}

	public function inventorySupplyList() {

		$this->inventorySupplyRequest->setSellerId($this->merchantID);
		$this->inventorySupplyRequest->setMarketplace($this->marketplaceID);
		$this->inventorySupplyRequest->setMWSAuthToken($this->mwsAuthToken);
		

		$dateTime = new DateTime();
		$dateTime->setISODate(1994, 7);
		$this->inventorySupplyRequest->setQueryStartDateTime($dateTime->format(DateTime::ISO8601));
		$this->inventorySupplyRequest->setResponseGroup('Detailed');

		if($this->service) {
			return parent::processRequest(
	 			$this->service,
	 			'listInventorySupply',
	 			$this->inventorySupplyRequest
	 		);
		}

 		// if($response) {
 		// 	$productData = $response->ListInventorySupplyResult->InventorySupplyList->member;
 		// 	$nextToken = $response->ListInventorySupplyResult->NextToken;

 		//  $this->saveInventoryListToDB($productData);

 		// 	if($nextToken) {
 		// 		return $nextToken;
 		// 	}
 		// }
 		
 		return false;
	}

	public function inventorySupplyListByNextToken($token) {
		
		if($token) {

			$this->inventorySupplyRequestNextToken->setSellerId($this->merchantID);
			$this->inventorySupplyRequestNextToken->setMarketplace($this->merchantID);
			$this->inventorySupplyRequestNextToken->setNextToken($token);

			$response = parent::processRequest(
				$this->service,
				'listInventorySupplyByNextToken',
				$this->inventorySupplyRequestNextToken
			);

			if($response) {

				$productDataByNextToken = $response->ListInventorySupplyByNextTokenResult->InventorySupplyList->member;
				$nextToken = $response->ListInventorySupplyByNextTokenResult->NextToken;

				$this->saveInventoryListToDB($productDataByNextToken);

				if($nextToken) {
					return $nextToken;
				}
			}

			return (-1);
		}
	}

	private function saveInventoryListToDB($data) {

		global $wpdb;

		$user_id = get_current_user_id();
		foreach ($data as $value) {

			$prevSKU = $wpdb->get_results(
				"SELECT seller_sku FROM wp_azlabs_clients_product_listings WHERE client_id = ".$user_id." AND asin = ".$value->ASIN
			);

			if(!$prevSKU || ($prevSKU && $prevSKU != $value->SellerSKU)) {
				$wpdb->insert(
					'wp_azlabs_clients_product_listings',
					array(
						'client_id' => $user_id,
						'seller_sku' => $value->SellerSKU,
						'fn_sku' => $value->FNSKU,
						'asin' => $value->ASIN,
						'condition' => $value->Condition,
						'total_supply_qty' => $value->TotalSupplyQuantity,
						'instock_supply_qty' => $value->InStockSupplyQuantity,
						'supply_detail' => json_encode($value->SupplyDetail),
						// 'date_updated' => date("Y-m-d H:i:s")
					)
				);
			}

		}#end foreach;
	}

}

?>