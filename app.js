
/**
 * Module dependencies.
 */

// var express = require('express')
//   , routes = require('./routes')
//   , user = require('./routes/user')
//   , http = require('http')
//   , path = require('path');

var express = require('express')
  , db = require('./model/db')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.json());       // to support JSON-encoded bodies
  app.use(express.urlencoded()); // to support URL-encoded bodies
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.post('/', routes.submit);
app.get('/data', routes.data);
// app.post('/submit', function(req, res) {
//   console.log(routes);

//   var data = req.body;
//   console.log("POSTED");
//   console.log(data);
// });

// app.get('/users', user.list);
app.get('/data', routes.data);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
