var Module = require('../../core/core.js').Module;
var fs = require("fs");
/***
* This function gets called after the project tree is built.
* The module_id variable contains the current unique id of this module instance,
* it can be used to communicate with other modules in the tree using the getModuleById(module_id) function.
***/
module.exports = function(projectLink, moduleId){
  this.initialize = function(){

  };

  this.onPreRender = function(input){
    // for(var i = 0; i < this.link.getProperty("items"); i++){
    //   var newmodule = this.link.createModule("content", {"module": "text"}).link;
    //   newmodule.setProperty("content", "item: " + i);
    // }
    // this.link.getModule("0-body-0-content-1").test();
    return input;
  };

  this.test = function(){
    console.log("it works! i am " + moduleId);
  };

  this.onPostRender = function(input){
    console.log("writing to " + this.link.getProperty("filename"));
    fs.writeFile(this.link.getProperty("filename"), input);
    return input;
  };

  return this;
};
