// Add a product to the services
function process_function_AddServices(task, value, callback = null){
    builder.Widget('services',{targetTable: task.root.targetTable,targetId: task.root.targetId,render:false}).create(function(){
        if(typeof callback === "function"){
            callback(task, null);
        }
    },value);
};
function process_meta_AddServices(key = null){
    const metadata = {
        label: "Add a Service",
        description: "Add a Service to the target",
        type: "none",
    };
    return metadata[key] ? metadata[key] : metadata;
}
