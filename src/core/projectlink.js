function ProjectLink(project, currentModule){
  this._project = project;
  this._module = currentModule;
}

ProjectLink.prototype.extend({
  getModule: function(path){
    var subTree = this._project.getSubtreeByPath(path);
    return (subTree instanceof module.parent.exports.Module) ? subTree.moduleEventInstance : null;
  },
  getRawProperty: function(propertyName){
    return this._module.propertyLookup(propertyName);
  },
  getProperty: function(propertyName){
    var p = this.getRawProperty(propertyName);
    return (p !== null) ? p.value : null;
  },
  getPropertyDefault: function(propertyName, defaultValue){
    var p = this.getRawProperty(propertyName);
    return (p !== null) ? p.value : defaultValue;
  },
  setProperty: function(propertyName, propertyValue){
    return this._module.propertySet(propertyName, propertyValue);
  },
  createModule: function(container, moduleConfig){
    var newModule = this._module.createChild(container, moduleConfig);
    var id = newModule.getPathToRoot();
    newModule.initialize(id, new module.parent.exports.ProjectLink(this._project, newModule));
    return newModule.moduleEventInstance;
  },
  isType: function(type){
    return this._module.isType(type);
  },
  render: function(input){
    return this._module.propertyRender(input);
  },
  super: function(){
    return this._module.$super != null ? this._module.$super.moduleEventInstance : null;
  }
});

module.exports = ProjectLink;
