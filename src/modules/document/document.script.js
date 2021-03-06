/***
* This function gets called after the project tree is built.
* The module_id variable contains the current unique id of this module instance,
* it can be used to communicate with other modules in the tree using the getModuleById(module_id) function.
*
* HTML module:
* requires global properties:
***/
module.exports = function(projectLink, moduleId){
  this.addJSFile = function(file){
    var scriptModule = this.link.createModule("script", {
      module: "script"
    }).link;
    scriptModule.setProperty("src", file);
  };

  this.addCSSFile = function(file){
    var cssLinkModule = this.link.createModule("head", {
      module: "metalink"
    }).link;
    cssLinkModule.setProperty("href", file);
  };

  return this;
};
