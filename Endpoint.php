<?php

/**
 * Core Framework - ServicesEndpoint
 *
 * @license    MIT (https://mit-license.org/)
 * @author     Louis Ouellet <louis@laswitchtech.com>
 */

// Import additionnal class into the global namespace
use \LaswitchTech\Core\Abstracts\Endpoint;

class ServicesEndpoint extends Endpoint {

    /**
     * Constructor
     */
    public function __construct()
    {

        // Call Parent Constructor
        parent::__construct();

        // Retrieve the namespace
        $namespace = $this->Request->getNamespace();

        // Set Global access
        $this->Public = false;

        // Set Level
        switch($namespace){
            case "/services/fetchAll":
            case "/services/fetch":
            case "/services/cap":
                $this->Level = 1;
                break;
            case "/services/create":
                $this->Level = 2;
                break;
            case "/services/update":
                $this->Level = 3;
                break;
            case "/services/archive":
            case "/services/recover":
                $this->Level = 4;
                break;
        }
    }

    /**
     * Retrieve Services
     */
    public function fetchAllAction(): array
    {
        // Set the default message
        $message = ["status" => 200, "message" => "OK", "data" => []];

        // Retrieve the conditions
        $conditions = $this->Request->getParams('REQUEST','conditions') ?? [];

        // Retrieve the conjunction
        $conjunction = $this->Request->getParams('REQUEST','conjunction') ?? 'AND';

        // Check if the services is accessible
        if($message['status'] == 200){

            // Check the request method
            if($this->Request->getMethod() == "POST"){

                // Retrieve the services records
                $message['data']['records'] = $this->Model->Services->fetchAll($conditions, $conjunction);
            } else {
                $message = ["status" => 405, "message" => "Method Not Allowed", "data" => "The method is not allowed for the requested URL."];
            }
        }
        return $message;
    }

    /**
     * Retrieve the commission cap for the services
     */
    public function capAction(): array
    {
        return ["status" => 200, "message" => "OK", "data" => (($this->Config->get('application','caps') ?? [])['commissions'] ?? 0)];
    }

    /**
     * Retrieve an item in the services
     */
    public function fetchAction(): array
    {
        // Set the default message
        $message = ["status" => 200, "message" => "OK", "data" => []];

        // Check if the services is accessible
        if($message['status'] == 200){

            // Check the request method
            if($this->Request->getMethod() == "GET"){

                // Retrieve the id
                $id = intval($this->Request->getParams('GET','id'));

                // Retrieve the services item
                if($item = $this->Model->Services->fetch($id)){
                    $message['data']['record'] = $item;
                } else {
                    $message = ["status" => 404, "message" => "Not Found", "data" => "The services item does not exist."];
                }
            } else {
                $message = ["status" => 405, "message" => "Method Not Allowed", "data" => "The method is not allowed for the requested URL."];
            }
        }
        return $message;
    }

    /**
     * Create an item in the services
     */
    public function createAction(): array
    {
        // Set the default message
        $message = ["status" => 200, "message" => "OK", "data" => []];

        // Check if the services is accessible
        if($message['status'] == 200){

            // Check the request method
            if($this->Request->getMethod() == "POST"){

                // Retrieve the parameters
                $parameters = $this->Request->getParams('REQUEST');

                // Set Required Fields
                $required = ['product','qty','price','rate','currency','commissions','targetTable','targetId'];

                // Check if all required fields are set
                if(count(array_intersect_key(array_flip($required), $parameters)) == count($required)){

                    // Check if the product exists
                    if($product = $this->Model->Products->fetch($parameters['product'])) {

                        // Create the services item
                        $item = $this->Model->Services->create($parameters);

                        // Check if the item was created
                        if($item){
                            $message['data']['record'] = $this->Model->Services->fetch($item);
                        } else {
                            $message = ["status" => 500, "message" => "Internal Server Error", "data" => "An error occurred while creating the services item."];
                        }
                    } else {
                        $message = ["status" => 404, "message" => "Not Found", "data" => "The product does not exist."];
                    }
                } else {
                    $missing = [];
                    foreach($required as $field){
                        if(!array_key_exists($field,$parameters)){
                            $missing[] = $field;
                        }
                    }
                    $message = ["status" => 400, "message" => "Bad Request", "data" => "Required fields [".implode(',',$missing)."] are missing."];
                }
            } else {
                $message = ["status" => 405, "message" => "Method Not Allowed", "data" => "The method is not allowed for the requested URL."];
            }
        }
        return $message;
    }

    /**
     * Update an item in the services
     */
    public function updateAction(): array
    {
        // Set the default message
        $message = ["status" => 200, "message" => "OK", "data" => []];

        // Check if the services is accessible
        if($message['status'] == 200){

            // Check the request method
            if($this->Request->getMethod() == "POST"){

                // Retrieve the parameters
                $parameters = $this->Request->getParams('REQUEST');

                // Set Required Fields
                $required = ['id'];

                // Check if all required fields are set
                if(count(array_intersect_key(array_flip($required), $parameters)) == count($required)){

                    // Check if the product exists
                    if($product = $this->Model->Products->fetch($parameters['product'])) {

                        // Create the services item
                        $item = $this->Model->Services->update($parameters['id'],$parameters);

                        // Check if the item was created
                        if($item){
                            $message['data']['record'] = $this->Model->Services->fetch($parameters['id']);
                        } else {
                            $message = ["status" => 500, "message" => "Internal Server Error", "data" => "An error occurred while creating the services item."];
                        }
                    } else {
                        $message = ["status" => 404, "message" => "Not Found", "data" => "The product does not exist."];
                    }
                } else {
                    $missing = [];
                    foreach($required as $field){
                        if(!array_key_exists($field,$parameters)){
                            $missing[] = $field;
                        }
                    }
                    $message = ["status" => 400, "message" => "Bad Request", "data" => "Required fields [".implode(',',$missing)."] are missing."];
                }
            } else {
                $message = ["status" => 405, "message" => "Method Not Allowed", "data" => "The method is not allowed for the requested URL."];
            }
        }
        return $message;
    }

    /**
     * Archive an item in the services
     */
    public function archiveAction(): array
    {
        // Set the default message
        $message = ["status" => 200, "message" => "OK", "data" => []];

        // Retrieve the Item
        $item = $this->Model->Services->fetch(intval($this->Request->getParams('GET','id')));

        // Check if the Item is accessible
        if(empty($item)){
            $message = ["status" => 404, "message" => "Not Found", "data" => "Could not find the requested item."];
        } else {
            if($item['organization']['id'] != $this->Auth->user()->organization()->id){
                $message = ["status" => 403, "message" => "Forbidden", "data" => "You are not allowed to access this item."];
            }
        }

        // Check if the Note is accessible
        if($message['status'] == 200){

            // Check the request method
            if($this->Request->getMethod() == "GET"){

                // Update the Item
                $this->Model->Services->update($item['id'], ["isArchived" => 1]);

                // Retrieve the Updated Item
                $message["data"]["record"] = $this->Model->Services->fetch($item['id']);
            } else {
                $message = ["status" => 400, "message" => "Bad Request", "data" => "Invalid Request Method"];
            }
        }

        return $message;
    }

    /**
     * Recover an item in the services
     */
    public function recoverAction(): array
    {
        // Set the default message
        $message = ["status" => 200, "message" => "OK", "data" => []];

        // Retrieve the Item
        $item = $this->Model->Services->fetch(intval($this->Request->getParams('GET','id')));

        // Check if the Item is accessible
        if(empty($item)){
            $message = ["status" => 404, "message" => "Not Found", "data" => "Could not find the requested item."];
        } else {
            if($item['organization']['id'] != $this->Auth->user()->organization()->id){
                $message = ["status" => 403, "message" => "Forbidden", "data" => "You are not allowed to access this item."];
            }
        }

        // Check if the Note is accessible
        if($message['status'] == 200){

            // Check the request method
            if($this->Request->getMethod() == "GET"){

                // Update the Item
                $affectedRows = $this->Model->Services->update($item['id'], ["isArchived" => 0]);

                // Retrieve the Updated Item
                $message["data"]["record"] = $this->Model->Services->fetch($item['id']);
            } else {
                $message = ["status" => 400, "message" => "Bad Request", "data" => "Invalid Request Method"];
            }
        }

        return $message;
    }
}
