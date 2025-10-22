<?php

// Import additionnal class into the global namespace
use \LaswitchTech\Core\Base\BaseModel;

class ServicesModel extends BaseModel {

    /**
     * Constructor
     */
    public function __construct()
    {
        // Call the parent constructor
        parent::__construct();

        // Initialize the Model
        $this->init('services');
    }

    /**
     * Process a record
     *
     * @param array $record
     * @return array
     */
    protected function process(array $record): array
    {
        // Call the parent constructor
        $record = parent::process($record);

        // Check if the record has a task
        if(array_key_exists('commissions', $record)){

            // Decode the JSON fields
            if(!is_array($record['commissions'])){
                $record['commissions'] = json_decode($record['commissions'] ?? "[]", true);
            }

            // Loop through each commission in the array
            foreach($record['commissions'] as $commissionKey => $commission){

                // fetch the commission's user
                $record['commissions'][$commissionKey]['user'] = $this->read('users', $commission['user']);
            }
        }

        // Return the processed record
        return $record;
    }

    /**
     * Apply Joins to the Query
     *
     * @param Query $Query
     * @return Query
     */
    protected function joins(object $Query): object
    {
        // Apply Joins
        $Query->join('product', 'products', 'id')
            ->join('agreement', 'files', 'id');

        return $Query;
    }

    /**
     * Update a record
     *
     * @param int $id
     * @param array $data
     * @return int
     */
    public function update(int $id, array $data): int
    {
        // Sanitize the Data
        foreach($data as $key => $value){

            // Add exceptions for specific fields
            if($key === 'commissions' && is_array($value)){

                // Loop through each step in the array
                foreach($value as $commissionKey => $commission){

                    // Sanitize the commission
                    // Float values
                    $value[$commissionKey]['rate'] = floatval($commission['rate'] ?? 0.0);
                    // Integer values
                    $value[$commissionKey]['user'] = intval($commission['user'] ?? 0);
                }
            }

            // Set the value back to the data array
            $data[$key] = $value;
        }

        // Call the parent update method
        return parent::update($id, $data);
    }
}
