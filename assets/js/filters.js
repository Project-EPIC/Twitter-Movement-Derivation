function addBaseTileControlObjects(controlObjects){
  for(var i=0; i<controlObjects.length; i++){
    var li = document.createElement("li")
    li.className = 'slider-filter'
    li.innerHTML = controlObjects[i]
    document.querySelector("#base-tile-filters").appendChild(li)
  }
}


// (This is a type of Input Control)
// (It's only designed for 3 options... one, other, or both)
var layerToggleSwitch = function(config){

  // this.layers = config['layers']

  this.options = config['options'] || ['fill','lines','both']

  this.inputControl = new InputControl({
    htmlID: 'paint-type-filter',
    getVar: 'layer',
    def:    0
  })

  //Add the input Control
  inputControls.push(this.inputControl)

  //Over-ride these functions!
  this.inputControl.getHTMLValue = function(){
    if (document.querySelector("#filter-0").checked) {
      return 0
    } else if (document.querySelector("#filter-1").checked) {
      return 1
    } else if (document.querySelector("#filter-2").checked) {
      return 2
    }
  }

  //Override
  this.inputControl.setHTMLValue = function(val){
    document.querySelector("#filter-"+val).checked = 'checked'
  }

  this.html = function(){
    return `<h3 class="prose">Layer Types</h3>
    <div id="paint-type-filter" class='rounded-toggle inline grey'>
      <input id='filter-0' type='radio' name='rtoggle' value='${this.options[0]}' checked='checked'>
      <label for='filter-0'>${this.options[0]}</label>
      <input id='filter-1' type='radio' name='rtoggle' value='${this.options[1]}'>
      <label for='filter-1'>${this.options[1]}</label>
      <input id='filter-2' type='radio' name='rtoggle' value='${this.options[2]}'>
      <label for='filter-2'>${this.options[2]}</label>
    </div>`
  }
}
