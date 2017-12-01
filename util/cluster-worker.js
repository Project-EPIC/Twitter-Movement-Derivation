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
var userName    = fileName.split(".")[0]
var metaFileName = userName + '-meta.geojson'

var UTCOffset   = -5;

function decimalDay(date, offset){
  var hours = date.getUTCHours()
  var day   = date.getUTCDay();

  if (hours+offset < 0){
    day = (((day-1)%6)+6)%6;
    hours = (((hours+UTCOffset)%23)+23)%23;
  }else{
    hours+=offset
  }

  return day + Math.floor(hours/3)/10;
}


try{
  var geojson = JSON.parse(fs.readFileSync(fileToParse))

  /*
    Part I : Clustering
  */

  //Get only features with geometry and cluster them
  var withGeometries    = []
  var withoutGeometries = []
  var otherTweets       = []

  var otherUsers = 0;

  geojson.features.map(function(f){
    //Don't count if the username doesn't match
    if (f.properties.user != userName){
      otherUsers++;
      otherTweets.push(f)
      return
    }

    if(f.geometry){
      withGeometries.push({
        type      : 'Feature',
        geometry  : f.geometry,
        properties: {
          tweetID: f.properties.tweetID || "",
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

  //console.warn("Size of withoutGeometries: " + withoutGeometries.length )
  //console.warn("Size of withGeometries: "    + withGeometries.length )
  //console.warn("Number of other Users: "     + otherUsers )

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
        //clusterCenter.properties.firstTimestamp = Math.floor(_.min(ts).getTime() / 1000)
        //clusterCenter.properties.lastTimestamp  = Math.floor(_.max(ts).getTime() / 1000)
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
    //console.warn(f.properties.date)
    var dateStr = f.properties.date;
    f.properties.dateStr = dateStr;
    var d = new Date(f.properties.date) //This is time aware, but only sort of.
    f.properties.date = d
    f.properties.timestamp = Math.floor(d.getTime()/1000) //UTC
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
  */

  var gbDay = _.groupBy(sortedFeatures, function(f){
    return decimalDay(f.properties.date, UTCOffset)
  })

  /*
             Days
    0 = Sunday    3 = Wednesday     6 = Saturday
    1 = Monday    4 = Thursday
    2 = Tuesday   5 = Friday

             Hours
    .0 = 1am  - 4 am      .4 = 12-15 (1pm - 4pm)
    .1 = 4am  - 7 am      .5 = 15-18 (4pm - 7pm)
    .2 = 7am  - 10am      .6 = 18-21 (7pm - 10pm)
    .3 = 10am - 1pm       .7 = 21-24 (10pm - 1am) (next day :/)
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

  var homeClusters = []
  var workClusters = []
  Object.keys(gbDay).forEach(function(key){
    if (homeHours.indexOf(Number(key))>-1){
      gbDay[key].map(function(f){
        if (f.properties.cluster){
          homeClusters.push(f.properties.cluster)
        }
      })
    }else if (workHours.indexOf(Number(key))>-1){
      gbDay[key].map(function(f){
        if (f.properties.cluster){
          workClusters.push(f.properties.cluster)
        }
      })
    }
  })
  var countedHome = _.countBy(homeClusters)
  var likelyHomeID = _.sortBy(Object.keys(countedHome), function(a){return -countedHome[a]})[0]

  var countedWork = _.countBy(workClusters)
  var likelyWorkID = _.sortBy(Object.keys(countedWork), function(a){return -countedWork[a]})[0]

  if (likelyHomeID){
    clusterCenters[likelyHomeID].properties.likelyHome = true
  }

  if (likelyWorkID){
    clusterCenters[likelyWorkID].properties.likelyWork = true
  }

  //console.warn("\n" + likelyHomeID + " " + likelyWorkID)

  var rejoinedSortedFeatures = _.sortBy(otherTweets.map(function(f){
    //Create proper objects from extra tweets
    var dateStr = f.properties.date;
    f.properties.dateStr = dateStr;
    var d = new Date(f.properties.date) //This is time aware, but only sort of.
    f.properties.date = d
    f.properties.timestamp = Math.floor(d.getTime()/1000) //UTC
    return f
  }).concat(sortedFeatures), function(f){return f.properties.date})


  fs.writeFileSync(fileToWrite+"/"+fileName, JSON.stringify({
      type:"FeatureCollection",
      features: rejoinedSortedFeatures
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
