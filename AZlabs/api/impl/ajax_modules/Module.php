<?php

class Module {

    private $azModules;
    private $module01;
    private $module03;
    private $module04;

    public function init($db, $amazonAPIservice) {
        $this->module01 = new Module01_createInboundShipmentPlan($db, $amazonAPIservice);
        $this->module03 = new Module03_inboundShipmentPlanInteract($db, $amazonAPIservice);
        $this->module04 = new Module04_AZlabSettings($db);

        $this->azModules = array(
            'module_01' => $this->module01,
            'module_03' => $this->module03,
            'module_04' => $this->module04,
        );
    }

    public function request() {

        $moduleName = isset($_POST['modID']) ? $_POST['modID'] : false;
        $fn = isset($_POST['load']) ? $_POST['load'] : false;

        if(isset($_POST['args'])) 
            $args = $_POST['args'];

        $result = false;

        if($fn && $moduleName) {
            if($args) 
                $result = $this->azModules[$moduleName]->$fn($args);
            else 
                $result = $this->azModules[$moduleName]->$fn();
        }

        if($result)
            echo json_encode($result, JSON_PRETTY_PRINT);
        else
            echo false;

        wp_die();
    }

}

?>