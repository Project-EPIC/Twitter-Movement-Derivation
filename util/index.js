#!/usr/bin/env node

'use strict';

const fork = require('child_process').fork;
const fs = require('fs')
const path = require('path')
const async = require('async');

const program = require('commander');
 
program
  .usage("[options] <INPUT_DIR> <OUTPUT_DIR>")
  .version('0.1.0')
  .option('-p, --cpus <n>', 'Number of CPUs', parseInt)
  .parse(process.argv);

var inputDir = program.args[program.args.length-2];
var outputDir = program.args[program.args.length-1];

var numWorkers = program.cpus || require('os').cpus().length - 2;

try{
  //Create global path
  var dirListing = fs.readdirSync(inputDir)
  var inputFiles = dirListing.map(function(f){
    return path.join( inputDir, f)
  })
}catch(e){
  console.error("\nERROR: Could not load input files");
  console.error(e);
  program.help();
}

console.warn("\nFound "+inputFiles.length+" input files, running with " + numWorkers + " cpus")

if (!fs.existsSync(outputDir)){
  try{
    console.warn("Output Diretory doesn't exist, creating");
    fs.mkdir(outputDir);
  }catch(e){
    console.error("ERROR: Could not make output directory")
    console.error(e)
    program.help
  }
}

var done = 0;
var skipped = 0;

//Setup the queue
var q = async.queue(function (filePath, callback) {

  //Call the process
  var child = fork('./cluster-worker', [filePath, outputDir], {silent: false});

  //Status Logging
  child.on('message', function(message) {
    if (message.success){
      process.stderr.write("\rProcessed: "+ ++done + " users. Last fileName: "+message.fileName+"                    ");
    }else if (message.status === 'skipped'){
      process.stderr.write("\nSkipping: "+ message.fileName + " with "+message.geometries+ " points. " + ++skipped + " users skipped.\n");
    }
    callback()
  });
}, numWorkers);

// assign a callback
q.drain = function() {
  console.warn('\nQueue has been drained; skipped ' + skipped + ' users');
}

//inputFiles = ['/data/chime/geo2/HARVEY/CortMarix.geojson']

//Add all the files to be processed to the queue:
q.push(inputFiles,function(){
  return;
});
