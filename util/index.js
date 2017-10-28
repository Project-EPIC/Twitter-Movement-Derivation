'use strict';

const fork = require('child_process').fork;
const fs = require('fs')
const path = require('path')
const async = require('async');

const numWorkers  = require('os').cpus().length - 2;

const inputDir = 'test/input'
const outputDir = 'test/output'

//Create global path
var dirListing = fs.readdirSync(inputDir)
var inputFiles = dirListing.map(function(f){
  return path.join( __dirname, inputDir,f)
})

console.warn("Found "+inputFiles.length+" input files")

var done = 0;

//Setup the queue
var q = async.queue(function (filePath, callback) {

  //Call the process
  var child = fork('./cluster-worker', [filePath, path.join(__dirname, outputDir)], {silent: false});

  //Status Logging
  child.on('message', function(message) {
    if (message.success){
      process.stderr.write("\rProcessed: "+ ++done + " user. Last fileName: "+message.finished);
    }
    callback()
  });
}, numWorkers);

// assign a callback
q.drain = function() {
  console.warn('\nQueue has been drained');
}

//inputFiles = ["/Users/jenningsanderson/Documents/Twitter-Movement-Derivation/util/test/input/48hippo.geojson"]

//Add all the files to be processed to the queue:
q.push(inputFiles.slice(0,5),function(){
  return;
});
