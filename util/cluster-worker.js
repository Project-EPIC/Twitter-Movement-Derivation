'use strict';

var dbscan = require('@turf/clusters-dbscan')
var turfCentroid = require('@turf/centroid')
var turfDistance = require('@turf/distance')
var fs     = require('fs')
var _      = require('lodash')

var fileToParse = process.argv[2];
var fileToWrite = process.argv[3];

var parts       = fileToParse.split('/')
var fileName    = parts[parts.length-1]

var geojson;

//console.log("In worker: " + process.pid + " with: " + fileToParse)

try{
  geojson = JSON.parse(fs.readFileSync(fileToParse))

  //Get only features with geometry and cluster them
  var withGeometries = []
  var withoutGeometries = []
  geojson.features.map(function(f){
    if(f.geometry){
      withGeometries.push({
        type      : 'Feature',
        geometry  : f.geometry,
        properties: {
          user: f.properties.user,
          text: f.properties.text,
          date: f.properties.date,
          speed: f.properties.speed || "",
          timeD: f.properties.time_delta || ""
        }
     })
   }else{
     withoutGeometries.push(f)
   }
  })

  var distance  = 1; //kilometers
  var minPoints = 5;
  var clustered = dbscan({
    type:'FeatureCollection',
    features: withGeometries
  }, distance);//, {minPoints: minPoints});

  var clusterGroups = _.groupBy(clustered.features,function(f){return f.properties.cluster})
  var clusterCenters = {}

  Object.keys(clusterGroups).forEach(function(cID){
    if(cID){
      clusterCenters[cID] = turfCentroid({type:'FeatureCollection',features:clusterGroups[cID]})
    }
  })

  //Break here if we haven't been able to classify anything

  //Now we merge all the properties back together, sorted by time
  var newFeatures = withoutGeometries.concat(clustered.features).map(function(f){
    f.properties.date = new Date(f.properties.date)
    return f
  })
  var sortedFeatures = _.sortBy(newFeatures, function(f){return f.properties.date})

  //Calculate Speeds
  var prev, cur, speed, timeDelta
  for(var i in sortedFeatures){
    cur  = sortedFeatures[i]
    if (i>0){
      prev = sortedFeatures[i-1]
      timeDelta = Math.floor((cur.properties.date - prev.properties.date)/1000)
      cur.properties.timeDelta = timeDelta
      //If both have points, use them:
      if (prev.geometry && cur.geometry){
        speed = turfDistance(prev, cur, 'miles') / (timeDelta/3600)
      }else{ //TODO: Be smart and use other points in the temporal cluster?
        speed = null
      }
      cur.properties.speed = speed
    }
  }

  fs.writeFileSync(fileToWrite+"/"+fileName, JSON.stringify({
      type:"FeatureCollection",
      features: sortedFeatures
    }, null, 2)
  )

  process.send({
    success: true,
    finished: fileToParse
  })

}catch(err){
  console.warn("Error on file: ", fileToParse)
  throw err
}

//Is this required at the end?
process.disconnect();
