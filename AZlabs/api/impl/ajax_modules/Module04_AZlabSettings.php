<?php

class Module04_AZlabSettings {

	private $db;
	const DEFAULT_CONTACT_PREFNAME = 'default_contact';
	const CURRENT_SERVED_CLIENT = 'current_client';

	public function __construct($db) {
		$this->db = $db; 
	}

	public function addNewContact($args) {
		
		$name = $args['name'];
		$phone = $args['phone'];
		$email = $args['email'];
		$fax = $args['fax'];

		$isInserted = $this->db->insert(
			'wp_azlabs_contacts', 
			array(
				'name' => $name,
				'phone' => $phone,
				'email' => $email,
				'fax' => $fax,
			)
		);

		if($isInserted)
			return $isInserted;

		return false;

	}

	public function retrieveContacts() {

		$query = "SELECT id FROM wp_azlabs_preference_storage WHERE preference_name = '" . self::DEFAULT_CONTACT_PREFNAME . "'";
		
		$defaultContact = $this->db->get_row($query, ARRAY_A);
		$defaultContact = (count($defaultContact) == 1) ? $defaultContact['id'] : false;

		$query = "SELECT * FROM wp_azlabs_contacts";
		$contactList = $this->db->get_results($query, ARRAY_A);

		return array(
			'defaultContactID'	=> $defaultContact,
			'list'				=> $contactList
		);
	}

	public function setDefaultContact($arg) {

		$prefName = $this->db->get_row(
			'SELECT preference_name FROM wp_azlabs_preference_storage WHERE preference_name = "'.self::DEFAULT_CONTACT_PREFNAME.'"',
			ARRAY_A
		);

		$prefName = $prefName['preference_name'];
		$endResult = false;

		if($prefName) {
			$endResult = $this->db->update(
				'wp_azlabs_preference_storage',
				array('id' => $arg['id']),
				array('preference_name' => $prefName)
			);
		}else {
			$endResult = $this->db->insert(
				'wp_azlabs_preference_storage',
				array(
					'preference_name' => self::DEFAULT_CONTACT_PREFNAME,
					'id' => $arg['id']
				)
			);
		}
		
		if($endResult)
			return true;

		return false;
	}

	public function deleteContact($arg) {
		$contactID = $arg['id'];

		if($contactID) {
			return $this->db->delete(
				'wp_azlabs_contacts',
				array('id' => $contactID)
			);
		}

		return false;
	}

	public function addAPIkey($args) {
		return $this->db->insert(
			'wp_azlabs_clients',
			array(
				'client_name' => $args['clientName'],
				'seller_id' => $args['sellerID'],
				'marketplace_id' => $args['marketID'],
				'mws_auth_token' => $args['mwsAuthToken'],
			)
		);
	}

	public function removeAPIkey($arg) {
		return $this->db->delete(
			'wp_azlabs_clients',
			array('id'=>$arg['id'])
		);
	}

	public function addNewShipFromAddress($args) {

		return $this->db->insert(
			'wp_azlabs_address',
			array(
				'name' => $args['addrName'],
				'address_line_1' => $args['addrLine1'],
				'address_line_2' => $args['addrLine2'],
				'city' => $args['addrCity'],
				'district_or_country' => $args['addrDistCountry'],
				'state_or_province' => $args['addrStProv'],
				'country_code' => $args['addrCCode'],
				'postal_code' => $args['addrPCode'],
			)
		);

	}

	public function getSelltecClients() {

		$clients = $this->db->get_results(
			'SELECT id, client_name FROM wp_azlabs_clients',
			ARRAY_A
		);

		return array(
			'current' => SelltecClient::getInstance()->getClientName(),
			'clients' => $clients,
		);
	}

	public function setCurrentClient($arg) {
		
		$hasPref = $this->db->get_row(
			'SELECT id FROM wp_azlabs_preference_storage WHERE preference_name = "' . self::CURRENT_SERVED_CLIENT . '"',
			ARRAY_A
		);

		if($arg['id']) {
			if($hasPref['id']) {
				$this->db->update(
					'wp_azlabs_preference_storage',
					array('id' => $arg['id']),
					array('preference_name' => self::CURRENT_SERVED_CLIENT)
				);
				return true;
			}else {
				return $this->db->insert(
					'wp_azlabs_preference_storage',
					array(
						'preference_name' => self::CURRENT_SERVED_CLIENT,
						'id' => $arg['id']
					)
				);
			}
		}else {
			if($hasPref['id']) {
				$this->db->delete(
					'wp_azlabs_preference_storage',
					array('preference_name' => self::CURRENT_SERVED_CLIENT)
				);
			}
			return true;
		}

		return false;
	}

	public function editClientInfo($args) {

		if($args['action'] === 'edit') {
			return $this->db->get_row(
				'SELECT * FROM wp_azlabs_clients WHERE id = ' . $args['id'],
				ARRAY_A
			);
		}else if($args['action'] === 'update') {
			$this->db->update(
				'wp_azlabs_clients',
				array(
					'client_name' => $args['clientName'],
					'seller_id' => $args['sellerID'],
					'marketplace_id' => $args['marketID'],
					'mws_auth_token' => $args['MWSauthToken'],
				),
				array('id' => $args['id'])
			);

			return true;
		}

		return false;
	}

}

?>