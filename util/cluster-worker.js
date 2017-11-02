'use strict';

var dbscan = require('@turf/clusters-dbscan')
var turfCentroid = require('@turf/centroid')
var turfDistance = require('@turf/distance')
var turfConvex   = require('@turf/convex')
var fs     = require('fs')
var _      = require('lodash')

var fileToParse = process.argv[2];
var fileToWrite = process.argv[3];

var parts       = fileToParse.split('/')
var fileName    = parts[parts.length-1]
var metaFileName = fileName.split('.')[0]+'-meta.geojson'

var geojson;

try{
  geojson = JSON.parse(fs.readFileSync(fileToParse))

  /*
    Part I : Clustering
  */

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
  var metaGeoms = []

  Object.keys(clusterGroups).forEach(function(cID){
    if(Number(cID) > -1){
      var clusterCenter = turfCentroid({type:'FeatureCollection',features:clusterGroups[cID]})
      clusterCenters[cID] = clusterCenter
      if (clusterCenter){
        var ts = clusterGroups[cID].map(function(f){return new Date(f.properties.date)})
        clusterCenter.properties.cluster = Number(cID)
        clusterCenter.properties.clusterCenter = true;
        clusterCenter.properties.firstTimestamp = Math.floor(_.min(ts).getTime() / 1000)
        clusterCenter.properties.lastTimestamp  = Math.floor(_.max(ts).getTime() / 1000)
        clusterCenter.properties.tweetCount = clusterGroups[cID].length
        metaGeoms.push(clusterCenter)
      }
      var convHull = turfConvex({type:'FeatureCollection',features:clusterGroups[cID]})
      if (convHull){
        convHull.properties.cluster = Number(cID)
        convHull.properties.tweetCount = clusterGroups[cID].length
        metaGeoms.push(convHull)
      }
    }
  })

  //Break here if we haven't been able to classify anything?

  //Now we merge all the properties back together, sorted by time
  var newFeatures = withoutGeometries.concat(clustered.features).map(function(f){
    var d = new Date(f.properties.date)
    f.properties.date = d
    f.properties.timestamp = Math.floor(d.getTime()/1000)
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

  /*
    Part II: Temporal Clustering

           Days
  0 = Sunday    3 = Wednesday //6 = Saturday
  1 = Monday    4 = Thursday
  2 = Tuesday   5 = Friday

           Hours
  .0 = 0-3      .4 = 12-15 (noon - 3)
  .1 = 3-6      .5 = 15-18 (3 - 6)
  .2 = 6-9      .6 = 18-21 (6 - 9)
  .3 = 9-12     .7 = 21-24 (9 - midnight)
*/

  var workHours = [
    1.2, 1.3, 1.4, 1.5,
    2.2, 2.3, 2.4, 2.5,
    3.2, 3.3, 3.4, 3.5,
    4.2, 4.3, 4.4, 4.5,
    5.2, 5.3, 5.4, 5.5,
  ]
  var homeHours = [
    0.6, 0.7,
    1.0, 1.1, 1.6, 1.7,
    2.0, 2.1, 2.6, 2.7,
    3.0, 3.1, 3.6, 3.7,
    4.0, 4.1, 4.6, 4.7,
    5.0, 5.1, 5.6, 5.7,
  ]

  var gbDay = _.groupBy(sortedFeatures, function(f){return f.properties.date.getDay() + Math.floor(f.properties.date.getHours()/3)/10})

  var homeClusters = []
  Object.keys(gbDay).forEach(function(key){
    if (homeHours.indexOf(Number(key))>-1){
      gbDay[key].map(function(f){
        if (f.properties.cluster){
          homeClusters.push(f.properties.cluster)
        }
      })
    }
  })
  var counted = _.countBy(homeClusters)
  var likelyHomeID = _.sortBy(Object.keys(counted), function(a){return -counted[a]})[0]

  if (likelyHomeID){
    clusterCenters[likelyHomeID].properties.likelyHome = true
  }

  //var csvStr = "day,tweets\n"
  //_.sortBy(Object.keys(gbDay)).forEach(function(k){
  //  str += `${k},${gbDay[k].length}\n`
  //})
  //console.warn(str)

  fs.writeFileSync(fileToWrite+"/"+fileName, JSON.stringify({
      type:"FeatureCollection",
      features: sortedFeatures
    }, null, 2)
  )
  fs.writeFileSync(fileToWrite+"/"+metaFileName, JSON.stringify({
      type:"FeatureCollection",
      features: metaGeoms
    }, null, 2)
  )

  process.send({
    success: true,
    finished: fileName
  })

}catch(err){
  console.warn("Error on file: ", fileToParse)
  throw err
}

//Is this required at the end?
process.disconnect();
