<?php

class PRODUCTS_MWS extends APIClassLoader {

	private $getMyPriceForAsin;

	public function __construct() {

		parent::__construct('MarketplaceWebServiceProducts',__FILE__);

		$this->APILoader('MarketplaceWebServiceProducts_Model_GetMyPriceForASINRequest', __FILE__);
		$this->APILoader('MarketplaceWebServiceProducts_Model_ASINListType', __FILE__);

		$this->getMyPriceForAsin = new MarketplaceWebServiceProducts_Model_GetMyPriceForASINRequest();
	}

	// @Override
	public function init($merchantID, $marketplaceID, $apiKeys, $serviceRegion, $mwsAuthToken = null) {

		parent::init($merchantID, $marketplaceID, $apiKeys, $serviceRegion, $mwsAuthToken);
		$this->service = new MarketplaceWebServiceProducts_Client(
	        $apiKeys['AWS_ACCESS_KEY_ID'],
	        $apiKeys['AWS_SECRET_ACCESS_KEY'],
	        $this->appName,
	        $this->appVersion,
	        $this->config
        );
	}

	public function getMyPriceForAsin($asin) {

		if(!$asin) 
			return false;

		$asinList = new MarketplaceWebServiceProducts_Model_ASINListType();
		$asinList->setASIN($asin);

		$this->getMyPriceForAsin->setSellerId($this->merchantID);
		$this->getMyPriceForAsin->setASINList($asinList);

		$response = parent::processRequest(
			$this->service,
 			'getMyPriceForASIN', 
 			$this->getMyPriceForAsin
		);

		if($response) {
			//TODO
		}
	}

}//end class...

?>