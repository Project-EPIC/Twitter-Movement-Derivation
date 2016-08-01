/*
    GLOBAL VARIABLES
*/

var inputControls = []
var yearChangeControls = []
var pageRenderControls = []
var globalVars ={}

/*
    OBJECT MODELS
*/

function InputControl(config){
  /*
    config = {
      'htmlID' : The ID of the HMTL slider
      'getVar' : The name of variable to saved in the URL
      'default': The default to load when not retrieved from Page State (0 is safe)
      'global' : The global Variable to be set (typically same as getVar)
      'visual' : The ID of the HTML feedback to set; if necessary!
    }
  */
  this.getVar = config['getVar']
  this.global = config['global'] || config['getVar']
  this.htmlID = config['htmlID'] || null
  this.htmlVis= config['htmlVis']
  this.def    = config['def'] || 0
  this.parse  = config['parse'] || parseFloat
  this.mapFilters = []

  this.setGlobal = function(val){
    globalVars[this.global] = val
  }

  this.getHTMLValue = function(){
    if (this.htmlID){return(this.parse( document.querySelector(`#${this.htmlID}`).value) );}
    else{return null}
  }

  this.setHTMLValue = function(val){
    if(this.htmlID){document.querySelector(`#${this.htmlID}`).value = val}
  }

  this.setHTMLVis = function(val){
    if(this.htmlVis){document.querySelector(`#${this.htmlVis}`).innerHTML = (val)}
  }

  this.getURLVar = function(){
    return ( JSON.parse( getUrlVars(this.getVar) ) || this.def);
  }

  this.setFromURL = function(){
    this.setGlobal(this.getURLVar())
  }

  this.render = function(){
    this.setHTMLVis(globalVars[this.global])
    this.setHTMLValue(globalVars[this.global])
    updateFilters() // Always update all inputs on render
  }

  this.updateGlobals = function(){
    return false;
  }

  this.registerHTMLInput = function(){
    var that = this; // Ha, classic
    var htmlInput = document.querySelector(`#${this.htmlID}`)
    htmlInput.addEventListener('change',function(e){
      globalVars[that.global] = that.getHTMLValue();
      that.render()
      updatePageState()
    });
  }
}


/*
    PAGE UTILITY FUNCTIONS
*/

// papermashup.com/read-url-get-variables-withjavascript/
function getUrlVars(k) {
  var vars = {};
  var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
    vars[key] = value;
  });
  if(vars[k]){
    return decodeURI(vars[k])
  }else{
    return null;
  }
}

function retrievePageState(){
  console.log("Retrieving Page State for each Conrol & Rendering")
  inputControls.forEach(function(inputControl){
    inputControl.setFromURL()
  });
  inputControls.forEach(function(inputControl){
    inputControl.render()
  });
}

function updatePageState(){
  console.log("Updating Page State, globals are:")
  console.log(globalVars)

  var get_vars = `?`
  inputControls.forEach(function(inputController){
    inputController.updateGlobals();
    get_vars += `${inputController.getVar}=${JSON.stringify(globalVars[inputController.global])}&`
  });
  var base;
  if (window.location.href.indexOf('?') > 0){
    base = window.location.href.slice(0,window.location.href.indexOf('?'))
  }else{
    base = window.location.href.slice(0,window.location.href.indexOf('#'))
  }
  var map  = window.location.href.slice(window.location.href.indexOf('#')+1,window.location.href.length)
  window.history.pushState(null,'',base+get_vars+"#"+map);
}

function stringifyBigNumber(number){
  if (number > 1000000){ (number/=1000000); return number.toFixed(1)+"M" }
  if (number > 1000){ (number/=1000); return number.toFixed(1)+"K" }
  return number;
}

function stringifyPercent(val){
  if (val < 0.01){
    return ('< 0.01 %');
  }else{
    return (val.toFixed(2).toString()+" %")
  }
}

function paint(){
  console.log("Called Default Paint Function... this should be over-ridden on each page to control base tilesets")
}

function toggleInfoBox(id){
  console.log("Toggling Information Box: " + id)
  var box = document.querySelector(id.toString())
  console.log(box)
  var className = box.className
  if( className == "visible info-popup" ){
      box.className = "invisible"
  }else{
      box.className = "visible info-popup"
  }
}

function showLoadingIcon(){
  document.querySelector("#loading-icon").className = 'active'
}

function hideLoadingIcon(){
  document.querySelector("#loading-icon").className = 'invisible'
}
var sideBarToggle=0;
document.querySelector('#sideBarToggle').addEventListener('click',function(){
  if(sideBarToggle==0){
    document.querySelector('#left-container').className = 'invisible'
    this.className = 'button collapsed'
    this.innerHTML = '>'
    sideBarToggle=1;
  }else{
    document.querySelector('#left-container').className = ''
    this.className = 'button open'
    this.innerHTML = '<'
    sideBarToggle=0;
  }
})
