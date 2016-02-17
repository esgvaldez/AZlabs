<?php

/**
	DEVELOPER's NOTE: 	reason behind creating this class was to find 
						a workaround on including PHP files from
						local directory ... 

						A workaround for plugins_url() from WP function ...
						replaced by APILoader() function ...

						if any of the details I am wrong or you have a better
						solution ... please change whatever code is needed to
						be fixed or improved and leave a comment for documentation.

						Thank you ...
*/

abstract class APIClassLoader {

	protected $db;

	protected $appName;
	protected $appVersion;
	protected $serviceUrl;
	protected $finalConfig;

	protected $merchantID;
	protected $marketplaceID;
	protected $config;
	protected $service;
	protected $mwsAuthToken;

	protected $xmlDoc;

	protected $productAdvertisingAPIKeys;
	protected $amazonEcs;

	/*
	param[0] -> type: String ... kind of API service used
	param[1] -> type: String ... the relative path where API path resides
	*/
	public function __construct($APItype, $dirPath) {

		global $wpdb;
		$this->db = $wpdb;

		$this->xmlDoc = new DOMDocument();

		$this->appName = $_SERVER['HTTP_USER_AGENT'];
		$this->appVersion = '2011-10-01';

		$this->productAdvertisingAPIKeys = array(
			'AWS_API_KEY' => 'AKIAISYFS4GEJ6E6O7NQ',
			'AWS_API_SECRET_KEY' => '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',
			'AWS_ASSOCIATE_TAG' => 'selltecprep-20'
		);

		$dependency = array();
		switch ($APItype) {
			case 'FBAInboundServiceMWS':
				$dependency = array(
					'APItype' => 'FulfillmentInboundShipment',
					'requiredClass' => array(
						'FBAInboundServiceMWS_Client',
						'FBAInboundServiceMWS_Model',
						'FBAInboundServiceMWS_Exception',
					)
				);
				break;
			case 'MarketplaceWebServiceProducts':
				$dependency = array(
					'APItype' => 'Products',
					'requiredClass' => array(
						'MarketplaceWebServiceProducts_Client',
						'MarketplaceWebServiceProducts_Model',
						'MarketplaceWebServiceProducts_Exception',
					)
				);
				break;
			case 'FBAInventoryServiceMWS':
				$dependency = array(
					'APItype' => 'FulfillmentInventory',
					'requiredClass' => array(
						'FBAInventoryServiceMWS_Client',
						'FBAInventoryServiceMWS_Model',
						'FBAInventoryServiceMWS_Exception',
					)
				);
				break;
		}

		$this->serviceUrl = array(
			'US' => 'https://mws.amazonservices.com/'.$dependency['APItype'].'/2010-10-01',
			'EU' => 'https://mws-eu.amazonservices.com/'.$dependency['APItype'].'/2010-10-01',
			'JP' => 'https://mws.amazonservices.jp/'.$dependency['APItype'].'/2010-10-01',
			'CN' => 'https://mws.amazonservices.com.cn/'.$dependency['APItype'].'/2010-10-01'
		);

		// Loading the specific API classes used by user ...
		foreach ($dependency['requiredClass'] as $value) 
		{
			$this->APILoader($value, $dirPath);
		}

		// Loads the Product Advertising API library...
		$this->APILoader('ProductAdvertising_AmazonECS.class', $dirPath);
		$this->amazonEcs = new AmazonECS(
			$this->productAdvertisingAPIKeys['AWS_API_KEY'], 
			$this->productAdvertisingAPIKeys['AWS_API_SECRET_KEY'], 
			'com', 
			$this->productAdvertisingAPIKeys['AWS_ASSOCIATE_TAG']
		);
		$this->amazonEcs->associateTag(
			$this->productAdvertisingAPIKeys['AWS_ASSOCIATE_TAG']
		);

	}

	public function init($merchant_id, $marketplace_id, $api_keys, $serviceRegion, $mwsAuthToken = null) {
		
		$this->merchantID = $merchant_id;
		$this->marketplaceID = $marketplace_id;
		$this->mwsAuthToken = $mwsAuthToken;

		$this->config = array (
		   'ServiceURL' => $this->serviceUrl[$serviceRegion],
		   'ProxyHost' => null,
		   'ProxyPort' => -1,
		   'ProxyUsername' => null,
		   'ProxyPassword' => null,
		   'MaxErrorRetry' => 3,
		);
	}

	protected function processRequest($service, $requestType, $request, $xmlFormat = true) {

		try {
			
			$response = $service->$requestType($request);

	        if($xmlFormat) {
	        	$dom = new DOMDocument();
		        $dom->loadXML($response->toXML());
		        $dom->preserveWhiteSpace = false;
		        $dom->formatOutput = true;

		        $result = $dom->saveXML();
		        $xml = simplexml_load_string($result);

		        return $xml;
	        }else {
	        	return $response;
	        }

		}catch(Exception $ex) {
			echo("Caught Exception: " . $ex->getMessage() . "<br>");
	        echo("Response Status Code: " . $ex->getStatusCode() . "<br>");
	        echo("Error Code: " . $ex->getErrorCode() . "<br>");
	        echo("Error Type: " . $ex->getErrorType() . "<br>");
	        echo("Request ID: " . $ex->getRequestId() . "<br>");
	        echo("XML: " . $ex->getXML() . "<br>");
	        echo("ResponseHeaderMetadata: " . $ex->getResponseHeaderMetadata() . "<br>");
		}

		return false;
	
	}

	protected function APILoader($className, $file) {
		$filepath = str_replace('_', DIRECTORY_SEPARATOR, $className) . '.php';
		require_once dirname($file) . '/' . $filepath;
	}
}

?>