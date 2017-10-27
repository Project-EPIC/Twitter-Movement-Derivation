process.on('message', function(message) {
  console.log('[child] received message from server:', message);
  setTimeout(function() {
    process.send({
      child   : process.pid,
      result  : message + 1
    });
    process.disconnect();
  }, (0.5 + Math.random()) * 5000);
});
