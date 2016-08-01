---
# /* Comment here so that Jekyll & Liquid parse it... */
---
//Create the search box & table & populate it...
var usersBox = document.querySelector("#page-control-box")
usersBox.innerHTML = `
<input id="userNameSearchBox" type="text" onchange="triggerUserSearch()">
  <p class="text light" id="userSearchStatus">Enter Username above and hit Enter</p>
  <div id="loading-icon" class="invisible">
    <img src="{{site.baseurl}}/assets/icons/loading.gif" />
  </div>
  <table id='selected-users-table' class='users-table'>
    <thead>
      <tr class='user-table-row'>
      <th class='users-table-icon'><svg style="width:11px; height:1em;" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="5" cy="10" r="4" fill="red" />
                        </svg></th>
      <th class='users-table edits'>Edits</th>
      <th class='users-table name'>Username<span class="icon bear-right"></th>
      </th><th><span class="icon eye"></span></th>
      <th><span class="icon trash"></span></th>
    </tr>
    </thead>
    <tbody>
      <tr style=""><td colspan="5" style="border-bottom:none;">
        <table>
          <tbody id='selected-users-table-body'>
          </tbody>
        </table>
      </td></tr>
    </tbody>
  </table>`
usersBox.className = 'filters-box'

var usersTable = document.querySelector("#selected-users-table-body")
var userChooser = document.querySelector('#userNameSearchBox')
var activeUsers = {} //Dictionary of current Users (Root Object)

//Will improve these colors soon!
var LIGHTCOLORS = [
  '#00FF00', // lime green
  '#FFCC66', // light orange
  '#FF6666', // salmon
  '#FC49A3', // pink
  '#CC66FF', // purple-ish
  '#66CCFF', // sky blue
  '#66FFCC', // teal
  '#FF2222', // vivid red
  '#FF8000', // orange
  '#FFFF66', // yellow
  '#00FFFF'  // turquoise
];

var lightColorsIdx = 0

userList.setHTMLVis = function(nil){return} // Overwrite enough of the default functions to not crash!
userList.render = function(){ //The initial render function
  globalVars.userList.forEach(function(name){
    triggerUserSearch(name);
  });
}
userList.updateGlobals = function(){
  globalVars.userList = Object.keys(activeUsers)
}
userList.yearChange = function(){
  console.log("Changing Year")
  userChooser.value = ''
  document.querySelector("#userSearchStatus").innerHTML = "Enter Username above and hit Enter"
  Object.keys(activeUsers).forEach(function(user){
    console.log(activeUsers[user]);
    activeUsers[user].activateCurrentYear(tileSets[globalVars.yearIdx].year);
  });
}

/*
  GLOBAL SCOPE FUNCTIONS
  - Button Controls
  - Layer Filtering Controls
*/

function triggerUserSearch(name=undefined){
  if(name==undefined){
    name = userChooser.value
  }
  console.log('Triggering User Search: ' + name)
  if(Object.keys(activeUsers).indexOf(name) < 0){
    new IndividualContributor({name: name, new:true}).activateCurrentYear(tileSets[globalVars.yearIdx].year)
  }else{
    console.log("user already on map")
  }
  console.log(globalVars)
}

function goToHottestTile(name){
  var tile_bounds = tileToGeoJSON(quadkeyToTile(activeUsers[name].yearData[tileSets[globalVars.yearIdx].year].hottest_tile.quadkey))
  var center = turf.centroid(tile_bounds)
  console.log(center)
  map.panTo(center.geometry.coordinates, {zoom:7});
}

function updateFilters(layerID){
  console.log("Updating Input Filters: " + layerID)
  Object.keys(activeUsers).forEach(function(name){
    if (!activeUsers[name].inactive){
      console.log('setting filters for' + name + " - layer: " + activeUsers[name].activeLayerID)
      map.setFilter(activeUsers[name].activeLayerID,
        ["all",
          [">=", 'p_edits', globalVars.minPercent],
          [">=", 'edits_val',  globalVars.minEdits]
        ])
      }
  });
}

/*
  OBJECTS
*/
function IndividualContributor(config){
  this.name    = config['name']
  this.uriName = config['uriName']
  this.yearData = {}
  this.activeLayerID = null;
  this.activeYear;
  this.inactive = false;
  this.user_color = LIGHTCOLORS[lightColorsIdx];
  lightColorsIdx = (lightColorsIdx+1)%10;

  this.buildRow  = function(){
    this.uTableRow = document.createElement("tr")
    var that = this
    var icon  = document.createElement("td")
      icon.innerHTML = `<svg style="width:11px; height:20px;" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="5" cy="10" r="5" fill="${that.user_color}" />
                        </svg>`;
      icon.className = 'users-table-icon users-table';
    this.uTableRow.appendChild(icon)

    //Save this object as it's own... so it can be referenced by the update function later
    this.tableRowEdits = document.createElement("td")
      this.tableRowEdits.appendChild(document.createTextNode(stringifyBigNumber(this.yearData[this.activeYear].userData[7])));
      this.tableRowEdits.className = 'users-table edits'
    this.uTableRow.appendChild(this.tableRowEdits)
    var name = document.createElement("td")
      name.appendChild(document.createTextNode(this.name));
      name.className = 'users-table name interactive'
      var that = this
      name.addEventListener('click',function(e){
        console.log("Clicked on userName" + that.name)
        goToHottestTile(that.name)
      })
    this.uTableRow.appendChild(name)

    var hideButton = document.createElement("td")
      hideButton.innerHTML = '<p><a class="icon eye"</span></p>'
      hideButton.className = 'users-table interactive';
      hideButton.addEventListener('click',function(e){
        console.log("Toggling Visibility: " + that.name)
        that.toggleVisibility()
      })
    this.uTableRow.appendChild(hideButton)

    var deleteButton = document.createElement("td")
        deleteButton.innerHTML = '<p><a class="icon trash"></span></p>'
        deleteButton.className = 'users-table interactive';
        deleteButton.addEventListener('click', function(e){
          if (!that.inactive){
            console.log("Clicked on delete for: " + that.name)
            that.deleteUser()
            that.uTableRow.parentNode.removeChild(that.uTableRow)
            delete that.uTableRow
            delete activeUsers[that.name]
            userList.updateGlobals();
            updatePageState()
          }else{
            console.log("Users need to be active to be deleted")
          }
        })
    this.uTableRow.appendChild(deleteButton)

    this.uTableRow.className = 'user-table-row';

    //Finally add the row
    usersTable.appendChild(this.uTableRow)
  }

  this.updateRowToCurrentYear = function(){
    this.tableRowEdits.innerHTML = stringifyBigNumber(this.yearData[this.activeYear].userData[7]);
  }

  this.toggleVisibility = function(){
    console.log("toggling user" + this.name)
    if(this.inactive){
      console.log("Reactivating User " + this.name)
      this.inactive = false;
      this.uTableRow.className = 'user-table-row'
      this.addLayer(this.yearData[this.activeYear])
    }else{
      console.log("Deactivating User " + this.name)
      this.inactive = true;
      this.uTableRow.className += ' inactive'
      map.removeLayer(this.activeLayerID)
    }
  }

  this.deleteUser = function(){
    map.removeLayer(activeUsers[this.name].activeLayerID)
    map.removeSource(activeUsers[this.name].yearData[tileSets[globalVars.yearIdx].year].sourceID);
  }


  this.activateCurrentYear = function(year){
    this.activeYear = year;
    console.log("activating current year: " + year)
    //If there is a current layer, then remove it.
    if(this.activeLayerID){ map.removeLayer(this.activeLayerID) }
    this.fetchAndAdd(year)
    userList.updateGlobals()
  }

  // Search for the user in S3
  this.fetchAndAdd = function(year){
    console.log("got here with user" + this.name)
    //Its easiest to just fetch and draw all in one function!
    if (this.yearData[year]){
      console.log("Already have data for this year, returning");
      this.addLayer(this.yearData[year])
      return;
    }
    user_tiles_dir = USER_DATA_S3_BASEURL + "world-" + year + "-"+USER_DATA_VERSION+"/"
    var that = this;
    showLoadingIcon()
    d3.json(user_tiles_dir+encodeURI(that.name)+".json",function(err, d){
      if (err){
        console.log("error, user not found for this year")
        document.querySelector('#userSearchStatus').innerHTML = `Sorry, <strong>${that.name}</strong> was not found. Try another username or year`
        that.activeLayerID = null;
        if(that.uTableRow){
          //This user exists in the activeList, but layer not found
          that.uTableRow.className += ' inactive'
          that.tableRowEdits.innerHTML = '--'
        }
        hideLoadingIcon()
      }else{
        userChooser.value = ''
        //If that user does exist, then we need to make sure it's activated!
        console.log("Found User, building features " + that.name)
        document.querySelector('#userSearchStatus').innerHTML = 'Enter Username above and hit Enter'
        that.uid  = d[0][1]
        that.name = d[0][2]
        //Build the source and return it
        var convertedTiles = {"type":"FeatureCollection","features":[]}
        var hottest_tile = d[1][0] //The JSON files are sorted!
        console.log("Amount of tiles: " + d[1].length);
        d[1].forEach(function(tile){
          tileFeat = {"type":"Feature", "geometry": tileToGeoJSON(quadkeyToTile(tile.quadkey))}
          actual_edits = tile.p_edits / 100 * d[0][7]
          tileFeat["properties"] = {
            'name'     : that.name,
            'p_edits'  : tile.p_edits,
            'edits_val': actual_edits,
            'edits'    : stringifyBigNumber(actual_edits)
          }
          convertedTiles.features.push(tileFeat)
        });
        that.yearData[year] = {
          sourceID: that.uid.toString()+"-"+year.toString(),
          hottest_tile: hottest_tile,
          userData: d[0]
        }
        console.log(hottest_tile)
        console.log("Size of Converted Tiles: " + convertedTiles.features.length)
        console.log("adding source with id: " + that.yearData[year].sourceID)
        console.log(that)
        console.log(convertedTiles)
        map.addSource(that.yearData[year].sourceID, new mapboxgl.GeoJSONSource({data : convertedTiles, minzoom:1}))
        that.addLayer(that.yearData[year])
        hideLoadingIcon()
      }
    })
  }

  this.addLayer = function(yearData){
    var that = this;
    console.log(yearData)
    this.activeLayerID = 'layer-'+that.uid+'-userEdits';
    this.addUserToList()
    if(this.inactive){this.reactivateUser()}
    map.addLayer({
      'id': 'layer-'+that.uid+'-userEdits',
      'type': 'fill',
      'source': yearData.sourceID, // The source for this year
      'layout': {},
      'paint': {
          'fill-color': {
          'property': 'p_edits',
            'stops': [
              [0, 'white'],
              [1, 'orange'],
              [5, 'orangered'],
              [10, 'red'],
              [25, 'darkred']
            ]
          },
          'fill-opacity': 0.5, //If we lower the opacity, then perhaps they can stack better?
          'fill-outline-color' : that.user_color
      }
    })
    updateFilters('layer-'+that.uid+'-userEdits')
  }

  this.addUserToList = function(){
    //If the user doesn't already exist in activeUsers...
    if(Object.keys(activeUsers).indexOf(this.name)<0){
      activeUsers[this.name] = this
      this.buildRow()
      if(globalVars.userList.indexOf(this.name)<0){ globalVars.userList.push(this.name) }
    }
    this.updateRowToCurrentYear()
    updatePageState()
  }

}
