<?php

if(!get_current_user_id()) { return; }

class AZlabsMiscRequest {
    
    // cache of data which saves requested info from the server.
    // this is to minimize the server request if data is most likely
    // do not change constantly ...
    private $dataCollection;
    
    public function __construct() {
        $this->dataCollection = array();
    }

    public function request($fn, $argument = null) {
        
        if($argument) {
            return $this->$fn($argument);
        } else {
            return $this->$fn();
        }
        
        return false;
    }

    /* PRIVATE FUNCTIONS */
    
    private function getItemListingsQuantity($args) {
        
        // TODO
        if($args) {
            return $args['f'] . "_" . $args['s']; // test...
        }
        
        return false;
    }
    
    private function getSelltecClients($a = false) {
        
        $result = false;
        $args = array(
            'orderby' => 'display_name',
            'order' => 'ASC'
        );
        
        $all_users = (array_key_exists('selltec_users', $this->dataCollection) && !$a) ? $this->dataCollection['selltec_users'] : get_users($args);
        
        if($all_users && is_array($all_users)) {
            
            $result = array();
            foreach ($all_users as $user) {
                $result[] = array(
                    'ID' => $user->data->ID,
                    'display_name' => $user->data->display_name
                );
            }
            
            $this->dataCollection['selltec_users'] = $all_users;
        }
        
        return $result;
    }

}
