const WebSocket = require('ws')
var finalhandler = require('finalhandler')
var http = require('http')
var serveStatic = require('serve-static')


const wss = new WebSocket.Server({ port: 8082 });

wss.on('connection', function connection(ws) {
  ws.on('error', (e) => console.log('errored: ' + e))
  ws.on('message', function incoming(data) {
    // Broadcast to everyone else.
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  });
});

var serve = serveStatic('public', {'index': ['index.html', 'index.htm']})

// Create server
var server = http.createServer(function onRequest (req, res) {
  serve(req, res, finalhandler(req, res))
})


server.listen(8080)