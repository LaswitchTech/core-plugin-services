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
        if(array_key_exists('commissions', $record) && is_array($record['commissions'])){

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
     * Retrieve multiple records
     *
     * @param array $conditions
     * @return array
     */
    public function fetchAll(array $conditions = [], string $conjunction = 'AND'): array
    {
        // Create the Query
        $Query = $this->Database->query()
            ->table($this->table)
            ->select('*')
            ->join('owner', 'users', 'username')
            ->join('product', 'products', 'id')
            ->join('agreement', 'files', 'id')
            ->join('organization', 'organizations', 'id')
            ->index($this->primary)
            ->filter()
            ->where('id', 9999, '<>')
            ->where('j__product.type', "Service", '=')
            ->where('organization', $this->Auth->user()->organization()->id);

        // Check if the conditions are empty
        if(!empty($conditions)){

            // Add a Filter
            $Query->filter();

            // Add the Conditions
            foreach($conditions as $condition){
                $Query->where($condition["key"], $condition["value"], $condition["operator"], $conjunction);
            }
        }

        // Retrieve the Results
        $records = $Query->fetch();

        // Loop through the records to process them
        foreach($records as $key => $record){

            // Overwrite the record with the processed one
            $records[$key] = $this->process($record);
        }

        // Return the Results
        return $records;
    }

    /**
     * Retrieve a single record
     *
     * @param int $id
     * @return array
     */
    public function fetch(int $id): array
    {
        // Create the Query
        $Query = $this->Database->query()
            ->table($this->table)
            ->select('*')
            ->join('owner', 'users', 'username')
            ->join('product', 'products', 'id')
            ->join('agreement', 'files', 'id')
            ->join('organization', 'organizations', 'id')
            ->filter()
            ->where('id', 9999, '<>')
            ->where('j__product.type', "Service", '=')
            ->where('organization', $this->Auth->user()->organization()->id)
            ->filter()
            ->where($this->primary, $id)
            ->limit(1);

        // Retrieve the record
        $records = $Query->fetch();

        // Loop through the records to process them
        foreach($records as $key => $record){

            // Overwrite the record with the processed one
            $records[$key] = $this->process($record);
        }

        // Return the record or an empty array if not found
        return $records[array_key_first($records)] ?? [];
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
