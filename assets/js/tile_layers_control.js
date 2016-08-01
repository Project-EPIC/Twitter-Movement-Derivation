/*
  Control tile layers as individual objects with distinct sources.
  Optimized for 1 MapBox Tile Source with many layers
*/

var VectorTileSource = function(config){
  this.sourceID = config['MapboxVectorTileSetID']
  this.addSourceToMap = function(){
    console.log(this)
    var sourceID = this.sourceID;
    map.addSource(sourceID, {
      type: 'vector',
      url: 'mapbox://'+sourceID
    });
  }
}

//Focus on Fill Layers for now, but this could get abstracted out into a Prototype
var VectorTileFillLayer = function(config){
  this.sourceID        = config['source'].sourceID
  this.sourceLayerID   = config['layerID']
  this.year            = config['year']
  this.layerID         = config['name'] + "-fill"
  this.visible         = false;
  this.fillpaint       = config['fillpaint'] || {'fill-opacity':1, 'fill-color':'red','fill-outline-color':'blue'}

  this.addLayerToMap = function(){
    var that = this;
    map.addLayer({
      'id': that.layerID,
      'minzoom':2,
      'maxzoom':10,
      'type': 'fill',
      'source': that.sourceID,
      'source-layer': that.sourceLayerID,
      'paint' : that.fillpaint,
      'layout' : {
          'visibility' : 'none'
      }
    });
    return this
  };

  this.turnOnOutline = function(){
    var that = this;
    map.setPaintProperty(that.layerID, 'fill-outline-color', '#00FF00');
  }

  this.show = function(){
    console.log(this)
    var that = this;
    map.setLayoutProperty(that.layerID,'visibility','visible')
    this.visible = true
  }

  this.hide = function(){
    var that = this;
    map.setLayoutProperty(that.layerID,'visibility','none')
    this.visible = false;
  }

  this.toggle = function(){
    var that = this;
    if(this.visible){
      this.hide()
    }else{
      this.show()
    }
  }
}

var VectorTileLineLayer = function(config){
  this.sourceID        = config['source'].sourceID
  this.sourceLayerID   = config['layerID']
  this.year            = config['year']
  this.layerID         = config['name'] + "-line"
  this.visible         = false;
  this.linepaint       = config['linepaint'] || {'line-opacity':1, 'line-color':'#00FF00'}
  this.maxZoom         = config['maxZoom'] || 10

  this.addLayerToMap = function(){
    var that = this;
    map.addLayer({
      'id': that.layerID,
      'minzoom':2,
      'maxzoom':that.maxZoom,
      'type': 'line',
      'source': that.sourceID,
      'source-layer': that.sourceLayerID,
      'paint' : that.linepaint,
      'layout' : {
          'visibility' : 'none'
      }
    });
    return this
  };

  this.show = function(){
    console.log(this)
    var that = this;
    map.setLayoutProperty(that.layerID,'visibility','visible')
    this.visible = true
  }

  this.hide = function(){
    var that = this;
    map.setLayoutProperty(that.layerID,'visibility','none')
    this.visible = false;
  }

  this.toggle = function(){
    var that = this;
    if(this.visible){
      this.hide()
    }else{
      this.show()
    }
  }
}

var LayersController = function(config={}){
  this.layers = []
  this.filter = config['filter']
  this.active = true;

  this.render = function(){
    if(this.active){
      //Render the active year
      this.layers[globalVars.yearIdx].show();
      this.visibleLayer = this.layers[globalVars.yearIdx]
    }
  }

  this.deactivate = function(){
    if (this.visibleLayer) this.visibleLayer.hide()
    this.active = false;
  }

  this.activate = function(){
    this.active = true;
    this.render()
  }

  //On a year change, toggle the currently visible layer, but only after disabling the other layers
  this.yearChange = function(){
    if(this.active){
      this.layers[globalVars.yearIdx].show();
      if(this.visibleLayer){this.visibleLayer.hide()}
      this.visibleLayer = this.layers[globalVars.yearIdx];
    }
  }

  this.updateFilters = function(){
    var that = this;
    if (this.active){
    //First ensure that we are working on the right things...
      map.setFilter(that.visibleLayer.layerID, that.filter());
    }
  }

  this.getActiveID = function(){
    if(this.visibleLayer){
      return [this.visibleLayer.layerID]
    }else{
      return []
    }
  }

}
