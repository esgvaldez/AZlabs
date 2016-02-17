<?php
require_once dirname(__FILE__).'/FBA_MWS.php';
require_once dirname(__FILE__).'/MWS_FulfillmentInventory.php';
require_once dirname(__FILE__).'/PRODUCTS_MWS.php';
require_once dirname(__FILE__).'/SelltecClient.php';

class AmazonAPIservice {

    const ITEM_LOOKUP = 1;
    const CREATE_INBOUND_SHIPMENT_PLAN = 2;
    const CREATE_INBOUND_SHIPMENT = 3;
    const PRODUCT_PRICE_FOR_ASIN = 4;
    const PRODUCT_PRICE_FOR_SKU = 5;
    const INVENTORY_SUPPLY_LIST = 6;
    const PUT_TRANSPORT_CONTENT = 7;
    const ESTIMATE_SHIPPING_COST = 8;
    const CONFIRM_TRANSPORT = 9;
    const PRINT_LABELS = 10;
    const VOID_TRANSPORT = 11;
    const UPDATE_SHIPMENT_ITEM = 12;
    const LIST_INBOUND_SHIPMENT = 13;
    const DELETE_SHIPMENT_ITEM = 14;

    private $db;

    private $api;
    private $apiDevData;
    private $FBAInboundService;
    private $MWSinventoryService;
    private $MWSproducts;

    public function __construct() {

        global $wpdb;
        $this->db =& $wpdb;

        $this->FBAInboundService = new FBA_MWS();
        $this->MWSinventoryService = new MWS_FulfillmentInventory();
        $this->MWSproducts = new PRODUCTS_MWS();

        $this->apiDevData = $this->db->get_row("SELECT AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, region FROM wp_azlabs_api_config", ARRAY_A);

        $this->api = array(
            $this->FBAInboundService,
            $this->MWSinventoryService,
            $this->MWSproducts
        );
    }

    public function accessAPI($request, $data = false) {

        $result = false;

        switch ($request) {
            case self::ITEM_LOOKUP:
                $result = $this->FBAInboundService->itemLookup($data);
                break;
            case self::CREATE_INBOUND_SHIPMENT_PLAN:
                $result = $this->FBAInboundService->createInboundShipmentPlan(
                    $data['planName'],
                    $data['planData'], 
                    $data['pickupAddress']
                );
                break;
            case self::CREATE_INBOUND_SHIPMENT:
                $result = $this->FBAInboundService->createInboundShipment($data);
                break;
            case self::PRODUCT_PRICE_FOR_ASIN:
                $result = $this->MWSproducts->getMyPriceForAsin($data);
                break;
            case self::PRODUCT_PRICE_FOR_SKU:
                # code...
                break;
            case self::INVENTORY_SUPPLY_LIST:
                if($data) {
                    $result = $this->MWSinventoryService->inventorySupplyListByNextToken($data);
                }else {
                    $result = $this->MWSinventoryService->inventorySupplyList();
                }
                break;
            case self::PUT_TRANSPORT_CONTENT:
                $result = $this->FBAInboundService->putTransportContent($data);
                break;
            case self::ESTIMATE_SHIPPING_COST:
                $result = $this->FBAInboundService->getEstimatedShippingCost($data);
                break;
            case self::CONFIRM_TRANSPORT:
                $result = $this->FBAInboundService->confirmTransportRequest($data);
                break;
            case self::PRINT_LABELS:
                // TODO
                break;
            case self::VOID_TRANSPORT:
                // TODO
                break;
            case self::UPDATE_SHIPMENT_ITEM:
                $result = $this->FBAInboundService->updateInboundShipment($data);
                break;
            case self::LIST_INBOUND_SHIPMENT:
                $result = $this->FBAInboundService->listInboundShipment($data);
                break;
            case self::DELETE_SHIPMENT_ITEM:
                $result = $this->FBAInboundService->updateInboundShipment($data);
                break;
        }

        return $result;
    }

    public function initAPI() {

        $query = 'SELECT pref.id, client.client_name, client.mws_auth_token, client.seller_id, client.marketplace_id FROM wp_azlabs_preference_storage AS pref INNER JOIN wp_azlabs_clients AS client ON pref.id = client.id AND pref.preference_name = "current_client"';
        $apiClientData = $this->db->get_row($query, ARRAY_A);

        if($this->apiDevData && $apiClientData) {

            SelltecClient::getInstance()->setClientInfo(
                $apiClientData['client_name'], 
                $apiClientData['id']
            );

            for($i = 0; $i < count($this->api); $i++) {

                $currAPI = $this->api[$i];
                $currAPI->init(
                    $apiClientData['seller_id'], 
                    $apiClientData['marketplace_id'],
                    array(
                            'AWS_ACCESS_KEY_ID' => $this->apiDevData['AWS_ACCESS_KEY_ID'], 
                            'AWS_SECRET_ACCESS_KEY' => $this->apiDevData['AWS_SECRET_ACCESS_KEY']
                    ), 
                    $this->apiDevData['region'],
                    $apiClientData['mws_auth_token']
                );
            }

            return true;
        }

        return false;
    }

}// end class...
