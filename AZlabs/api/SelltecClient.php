<?php

class SelltecClient {

	private static $instance;

	private $clientName;
	private $clientID;

	public static function getInstance() {

		if(null === static::$instance) {
			static::$instance = new static();
		}

		return static::$instance;
	}

	protected function __construct() {}
	private function _clone() {}
	private function _wakeup() {}

	public function setClientInfo($clientName, $clientID) {
		$this->clientName = $clientName;
		$this->clientID = $clientID;
	}

	public function getClientName() {
		return $this->clientName;
	}

	public function getClientID() {
		return $this->clientID;
	}
}

?>