/***
* This function gets called after the project tree is built.
* The module_id variable contains the current unique id of this module instance,
* it can be used to communicate with other modules in the tree using the getModuleById(module_id) function.
***/
module.exports = function(projectLink, moduleId){
  this.onPostRender = function(renderOutput){
    return renderOutput;
  };

  this.onPreRender = function(renderInput){
    return renderInput;
  };

  this.onCommunicate = function(){

  };
  
  return this;
};
