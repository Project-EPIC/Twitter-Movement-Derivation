var child_process = require('child_process');

var numchild  = require('os').cpus().length;
var done      = 0;

for (var i = 0; i < numchild; i++){
  var child = child_process.fork('./child');
  child.send((i + 1) * 1000);
  child.on('message', function(message) {
    console.log('[parent] received message from child:', message);
    done++;
    if (done === numchild) {
      console.log('[parent] received all results');
    }
  });
}
