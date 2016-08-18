var _path = require("path");
var _fs = require("fs");
var Container = require('./container.js');
var DefaultModule = require("./module.default.js");
var _async = require('async');

function Module(moduleObject, moduleName){
  var extendedModuleObject = {
    "name": null,
    "script": null,
    "content": null,
    "extends": null,
    "properties": [],
    "containers": []
  }.extend(moduleObject);

  var self = this;
  this.containers = {};
  this.properties = {};
  this.propertylist = [];
  this.name = moduleName;
  this.$super = null;
  this.$parentContainer = null;
  this.content = null;
  this.script = null;
  this.moduleEventInstance = null;

  this.contentFile = extendedModuleObject.content !== null ? _path.resolve(__dirname, "..", "modules", this.name, extendedModuleObject.content) : null;
  this.scriptFile = extendedModuleObject.script !== null ? _path.resolve(__dirname, "..", "modules", this.name, extendedModuleObject.script) : null;

  extendedModuleObject.properties.forEach(function(elem){
    self.propertylist.push(elem.name);
    self.properties[elem.name] = {
      "name": null,
      "type": null,
      "value": null,
      "readonly": false,
      "inherited": false
    }.extend(elem);
  });

  //Load inherited module
  if(extendedModuleObject.extends !== null){
    this.$super = Module.create(extendedModuleObject.extends);
  }

  // Load containers from moduleObject into containers object
  if(typeof(extendedModuleObject.containers) !== 'undefined' && Array.isArray(extendedModuleObject.containers)){
    extendedModuleObject.containers.forEach(function(containerObject){
      if(typeof(containerObject.id) !== 'undefined'){
        self.containers[containerObject.id] = new Container(containerObject, self);
      }
    });
  }

  return this;
}

Module.prototype.getPathToRoot = function(){
  var currentNode = this;
  var newNode = null;
  var path = "";
  while(currentNode instanceof Module || currentNode instanceof Container){
    if(currentNode instanceof Module){
      newNode = currentNode.$parentContainer;
      if(newNode !== null){
        path = newNode.containerProperties.id + "-" + newNode.getId(currentNode) + (path.length > 0 ? ("-" + path) : "");
      }else{
        path = "0-" + path;
      }
      currentNode = newNode;
    }else if(currentNode instanceof Container){
      currentNode = currentNode.$parentModule;
    }
  }
  //console.log(currentNode);
  return path;
};

Module.prototype.initialize = function(id, projectLink){
  if(this.$super !== null){
    this.$super.initialize(id, projectLink);
  }

  if(this.contentFile !== null){
    this.content = _fs.readFileSync(this.contentFile, 'UTF-8');
  }
  if(this.scriptFile !== null){
    this.script = require(this.scriptFile);
  }
  if(typeof(this.script) === 'function'){
    this.moduleEventInstance = new this.script(projectLink, id);
  }else{
    this.moduleEventInstance = new DefaultModule(projectLink, id);
  }
  this.moduleEventInstance.link = projectLink;
  this.moduleEventInstance._id = id;
  if(typeof(this.moduleEventInstance.initialize) === 'function'){
    this.moduleEventInstance.initialize();
  }
  return this;
};

Module.prototype.getContainers = function(){
  var clist = [];
  for(var i in this.containers){
    if(this.containers.hasOwnProperty(i)){
      clist.push(i);
    }
  }
  return clist;
};

Module.prototype.initializeProperties = function(properties){
  var self = this;
  properties.forEach(function(property){
    if(typeof(self.properties[property.name]) !== 'undefined'){
      self.properties[property.name].extend(property);
    }else{
      self.properties[property.name] = {
        "name": null,
        "type": null,
        "value": null,
        "readonly": false
      }.extend(property);
      self.propertylist.push(property.name);
    }
  });
};

Module.prototype.addChild = function(containerId, childModule){
  if(childModule instanceof Module){
    if(typeof(this.containers[containerId]) !== 'undefined' && (this.containers[containerId] instanceof Container)){
      this.containers[containerId].addChild(childModule);
    }
  }
};

//TODO: use createChild to build project tree
Module.prototype.createChild = function(containerId, childProperties){
  var self = this;
  if(typeof(childProperties) !== 'object'){
    childProperties = {};
  }
  var extendedChildProperties = {
    "module": "",
    "properties": [],
    "child_containers": [],
    "children": {}
  }.extend(childProperties);

  var modulePath = _path.resolve(__dirname, "..", "modules", extendedChildProperties.module, "module.json");

  if(typeof(this.containers[containerId]) !== 'undefined' && (this.containers[containerId] instanceof Container)){
    var initialProperties = this.propertylist.map(function(propertyName){
      return self.properties[propertyName];
    });

    var moduleObject = require(modulePath);
    var newModule = new Module(moduleObject, extendedChildProperties.module);
    newModule.initializeProperties(initialProperties, true);
    newModule.initializeProperties(extendedChildProperties.properties);

    this.addChild(containerId, newModule);
    return newModule;
  }else{
    return null;
  }
};

Module.prototype.addChildAt = function(containerId, index, childModule){
  if(childModule instanceof Module){
    if(typeof(this.containers[containerId]) !== 'undefined' && (this.containers[containerId] instanceof Container)){
      this.containers[containerId].addChildAt(index, childModule);
    }
  }
};

Module.prototype.exportContainers = function(containers, parentId){
  var containerExport = {};
  var self = this;
  containers.forEach(function(container){
    containerExport[container] = self.containers[container].export(parentId + "-" + container);
  });
  return containerExport;
};

Module.prototype.getSubtreeByPath = function(pathList){
  if(typeof(pathList) !== 'undefined' && Array.isArray(pathList)){
    var containerKey = pathList.shift();
    if(pathList.length === 0){
      return this.containers[containerKey];
    }else{
      return this.containers[containerKey].getSubtreeByPath(pathList);
    }
  }else if(typeof(pathList) === 'string'){
    return this.getSubtreeByPath(pathList.split("-"));
  }else{
    console.log("invalid pathlist");
    return null;
  }
};

Module.prototype.exportProperties = function(){
  var self = this;
  var superProperties = [];
  return this.propertylist.map(function(propertyId){
    var property = self.properties[propertyId];
    return property;
  });
};

Module.prototype.export = function(parentId){
  var self = this;
  var containers = self.getContainers();
  return {
    "module": self.name,
    "child_containers": containers,
    "children": self.exportContainers(containers, parentId),
    "properties": self.exportProperties()
  };
};

Module.prototype.propertyLookup = function(propertyName){
  var localProperty = this.localPropertyLookup(propertyName);
  if(typeof(localProperty) !== 'undefined'){
    localProperty.inherited = false;
    return localProperty;
  }else{
    var parentContainer = this.$parentContainer;
    var parentModule = (parentContainer instanceof Container) ? parentContainer.$parentModule : null;
    var treeProperty = null;
    while(parentModule instanceof Module){
      treeProperty = parentModule.localPropertyLookup(propertyName);
      if(typeof(treeProperty) !== 'undefined'){
        treeProperty.inherited = true;
        return treeProperty;
      }
      parentContainer = parentModule.$parentContainer;
      parentModule = (parentContainer instanceof Container) ? parentContainer.$parentModule : null;
    }
  }
  return null;
};

Module.prototype.localPropertyLookup = function(propertyName){
  return this.properties[propertyName];
};

//TODO: local property lookup and set
Module.prototype.propertySet = function(propertyName, propertyValue){
  var property = this.propertyLookup(propertyName);
  if(property !== null && property.inherited === false){
    property.value = propertyValue;
    return true;
  }else if(property !== null){
    return this.localPropertySet(propertyName, property.extend({
      "value": propertyValue,
      "inherited": false
    }));
  }else{
    return false;
  }
};

Module.prototype.localPropertySet = function(propertyName, propertyData){
  this.properties[propertyName] = {
    "name": null,
    "type": null,
    "value": null,
    "readonly": false
  }.extend(propertyData);
  return true;
};

Module.prototype.walkSubtree = function(parentId, mainCallback){
  var self = this;
  if(typeof(mainCallback) !== 'function'){
    mainCallback = function(){};
  }
  mainCallback(this, parentId);

  this.getContainers().forEach(function(containerId){
    self.containers[containerId].walkSubtree(parentId + "-" + containerId, mainCallback);
  });
};

Module.prototype.getContent = function(){
  if(this.content !== null){
    return this.content;
  }else{
    if(this.$super !== null){
      return this.$super.getContent();
    }else{
      return "";
    }
  }
};

Module.prototype.isType = function(typeName){
  if(this.name == typeName){
    return true;
  }else{
    return (this.$super !== null) ? this.$super.isType(typeName) : false;
  }
};

Module.prototype.preRenderContent = function(content){
  var self = this;
  var renderInput = content;
  if(this.$super !== null){
    renderInput = this.$super.preRenderContent(renderInput);
  }

  if(this.moduleEventInstance !== null && typeof(this.moduleEventInstance.onPreRender) === 'function'){
    renderInput = this.moduleEventInstance.onPreRender(renderInput);
    if(typeof(renderInput) !== "string"){
      renderInput = "";
    }
  }

  return renderInput;
};

Module.prototype.postRenderContent = function(content){
  var self = this;
  var renderInput = content;
  if(this.$super !== null){
    renderInput = this.$super.postRenderContent(renderInput);
  }

  if(this.moduleEventInstance !== null && typeof(this.moduleEventInstance.onPostRender) === 'function'){
    renderInput = this.moduleEventInstance.onPostRender(renderInput);
    if(typeof(renderInput) !== "string"){
      renderInput = "";
    }
  }

  return renderInput;
};

Module.prototype.render = function(){
  var self = this;
  var renderInput = this.getContent();

  renderInput = this.preRenderContent(renderInput);

  var sysRenderOutput = renderInput.replace(/{(\S+)}/g, function(totalMatch, property){
    return self.propertyLookup(property).value;
  }).replace(/\/\/(\S+)\\\\/g, function(totalMatch, container){
    if(typeof(self.containers[container]) !== 'undefined' && self.containers[container] !== null){
      return self.containers[container].render();
    }else{
      return "";
    }
  });

  sysRenderOutput = this.postRenderContent(sysRenderOutput);

  return sysRenderOutput;
};

// Static methods
Module.create = function(moduleName){
  var modulePath = _path.resolve(__dirname, "..", "modules", moduleName, "module.json");
  var fsStat = null;

  try {
    fsStat = _fs.statSync(modulePath);
  } catch (e) {
    return null;
  }

  if(!fsStat.isFile()){
    return null;
  }

  var moduleObject = require(modulePath);
  return new Module(moduleObject, moduleName);
};

module.exports = Module;
