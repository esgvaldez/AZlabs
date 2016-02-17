<?php
/*
    Plugin Name: AZ Labs
    Description: Amazon Services
    Author: Edward Simon G. Valdez
    Version: 0.9.2
*/

require_once(dirname(__FILE__).'/AZ-content.php');
require_once(dirname(__FILE__).'/api/impl/APIClassLoader.php'); // Amazon API class loader...
require_once(dirname(__FILE__).'/api/AmazonAPIservice.php');

require_once(dirname(__FILE__).'/api/impl/ajax_modules/Module.php');
require_once(dirname(__FILE__).'/api/impl/ajax_modules/Module01_createInboundShipmentPlan.php');
// require_once(dirname(__FILE__).'/api/impl/ajax_modules/Module02_loadInventoryList.php');
require_once(dirname(__FILE__).'/api/impl/ajax_modules/Module03_inboundShipmentPlanInteract.php');
require_once(dirname(__FILE__).'/api/impl/ajax_modules/Module04_AZlabSettings.php');
// TEST
require_once(dirname(__FILE__).'/api/impl/ajax_modules/AZlabsMiscRequest.php');

class AZ_Labs {

    private $db;
    private $view;
    private $amazonAPIservice;

    private $module;
    private $comlink;

    public function __construct() {

        global $wpdb;
        $this->db = $wpdb;

        add_action('init', array($this, 'az_init'));
        add_action('admin_enqueue_scripts', array($this, 'register_plugin_scripts'));
        add_action('admin_menu', array($this, 'az_labs_setup_menu'));

        // AJAX request...
        add_action('wp_loaded', array($this, 'az_ajax'));
    }

    function az_init() {
        $this->view = new ContentLoading();
        $this->amazonAPIservice = new AmazonAPIservice();
        $this->amazonAPIservice->initAPI();

        $this->module = new Module();
        $this->module->init($this->db, $this->amazonAPIservice);
        
        $this->comlink = new AZlabsMiscRequest();
    }

    function az_ajax() {
        add_action('wp_ajax_request_data', array($this->module, 'request'));
        add_action('wp_ajax_initialize_api', array($this, 'az_ajax_init'));
        add_action('wp_ajax_execute_link', array($this, 'az_ajax_com_bridge'));
    }

    function az_ajax_init() {
        $this->amazonAPIservice->initAPI();
        $this->module->init($this->db, $this->amazonAPIservice);
        echo json_encode(true, JSON_PRETTY_PRINT);
        wp_die();
    }
    
    function az_ajax_com_bridge() {
        
        $f = filter_input(INPUT_POST, 'load_func', FILTER_SANITIZE_ENCODED);
        $a = isset($_POST['arguments']) ? $_POST['arguments'] : false;
        
        if(isset($f)) {
            
            $data = $this->comlink->request($f, $a);

            if ($data) {
                echo json_encode($data, JSON_PRETTY_PRINT);
            } else {
                echo false;
            }
        }else {
            echo false;
        }

        wp_die();
    }

    function register_plugin_scripts($hook) {

        if($hook !== 'toplevel_page_az-labs') { return; }

        // STYLES
        wp_enqueue_style('az-styles1', plugins_url('/assets/css/bootstrap.min.css', __FILE__), false, false);
        wp_enqueue_style('az-styles2', plugins_url('/assets/css/azcustom.css', __FILE__), false, false);
        wp_enqueue_style('az-styles3', plugins_url('/assets/css/floating.menu.css', __FILE__), false, false);
        wp_enqueue_style('az-styles4', plugins_url('/assets/css/bootstrap-datepicker.min.css', __FILE__), false, false);

        // SCRIPTS
        wp_enqueue_script('az-jquery', plugins_url('/assets/js/jquery.1.11.3.min.js', __FILE__), array(), false, false);
        wp_enqueue_script('az-script1', plugins_url('/assets/js/bootstrap.min.js', __FILE__), array(), false, false);
        wp_enqueue_script('az-script2', plugins_url('/assets/js/azlabs.js', __FILE__), array(), false, false);
        wp_enqueue_script('az-script3', plugins_url('/assets/js/azlabs/azevents.js', __FILE__), array(), false, false);
        wp_enqueue_script('az-script4', plugins_url('/assets/js/bootbox.js', __FILE__), array(), false, false);
        wp_enqueue_script('az-script5', plugins_url('/assets/js/bootstrap-datepicker.min.js', __FILE__), array(), false, false);
        wp_enqueue_script('az-script6', plugins_url('/assets/js/typeahead.bundle.min.js', __FILE__), array(), false, false);

        wp_enqueue_script('test-script', plugins_url('/assets/js/azlink.js', __FILE__), array(), false, false);
        
        add_action('admin_footer', array($this, 'az_footer_scripts'));

    }

    function az_labs_setup_menu() {
        add_menu_page(
            'AZ Labs', 'AZ Labs', 'manage_options', 'az-labs', 
            array($this,'az_labs_render_view'), 
            plugins_url('assets/img/az-logo.png',__FILE__)
        );
    }

    function az_labs_render_view() {
        $this->view->render("az-home-page.php");
    }

    function az_footer_scripts() {
        echo "<script src=".plugins_url('assets/js/azlabs/azlabsTools.js', __FILE__)."></script>";
    }

}// end class...

new AZ_Labs();
        