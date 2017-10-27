var dbscan = require('@turf/clusters-dbscan')


module.exports = function(geojson, params, done){

// create random points with random z-values in their properties
var points = turf.random('point', 100, {
  bbox: [0, 30, 20, 50]
});
var distance = 100;
var clustered = turf.clustersDbscan(points, distance);


done()
}
