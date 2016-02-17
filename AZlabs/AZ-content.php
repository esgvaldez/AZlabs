<?php

class ContentLoading {

    const MODULE = 1;

    private $userData;

    public function __construct() {
        $this->userData = array();
        $this->moduleContent = array();
    }

    public function render($content, $state = 0) {

        #check state if the rendering view is a Module...
        if (!$state) {
            if (!$content)
                wp_die('ERROR: No content being loaded.');

            include_once('tpl/az-content-start.php');
            include('tpl/' . $content);
            include_once('tpl/az-content-end.php');
            return;
        }

        // Render the module...
        ob_start();
        echo $content;
        ob_flush();
    }

    public function create($tagName, $attribute = array(), $content = '') {

        if (!$tagName)
            return;

        $HTMLtag = "<" . $tagName . " ";
        if (is_array($attribute) && $attribute) {
            // checks if the $attribute is an associative kind of array...
            if (array_keys($attribute) !== range(0, count($attribute) - 1)) {
                foreach ($attribute as $key => $value) {
                    if ($value)
                        $HTMLtag .= $key . "='" . $value . "' ";
                    else
                        $HTMLtag .= $key . " ";
                }
            }
        }

        if (is_array($content)) {
            $tempContent = "";
            foreach ($content as $value) {
                $tempContent .= " " . $value . " ";
            }
            $content = $tempContent;
        }

        $emptyElems = array(
            'area',
            'base',
            'br',
            'col',
            'command',
            'embed',
            'hr',
            'img',
            'link',
            'meta',
            'param',
            'source'
        );

        if (!in_array($tagName, $emptyElems)) {
            $HTMLtag = ($content) ? $HTMLtag . ">" . $content . "</$tagName>" : $HTMLtag . "></$tagName>";
        } else {
            $HTMLtag = ($content) ? $HTMLtag . ">" . $content : $HTMLtag . ">";
        }

        return $HTMLtag;
    }

    public function setUserData($key, $data) {

        if (array_key_exists($key, $this->userData)) {
            array_push($this->userData[$key], $data);
            return;
        }

        $this->userData[$key] = $data;
    }

    public function getUserData($key) {
        return $this->userData[$key];
    }

    public function clearUserData($key = '', $data = '', $isArray = false) {

        if ($key && array_key_exists($key, $this->userData)) {
            if ($data) {
                foreach ($this->userData[$key] as $index => $values) {
                    foreach ($values as $value) {
                        if ($value == $data) {
                            unset($this->userData[$key][$index]);
                            return true;
                        }
                    }
                }
            }
            unset($this->userData[$key]);
            return true;
        } elseif ($key == 'all') {
            unset($this->userData);
            return true;
        }

        return false;
    }

}

?>