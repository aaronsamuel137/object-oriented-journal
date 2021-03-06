
/**
 * Module dependencies.
 */

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
  app.use(express.cookieParser());
  app.use(express.session({secret: 'iyg2f7eygr248972r', cookie: { maxAge: 3600000 }}));
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

app.get('/', routes.home);
app.get('/data', routes.data);
app.get('/login', routes.login);
app.post('/login', routes.loginPost);
app.get('/logout', routes.logout);
app.post('/signup', routes.signup);
app.get('/similar', routes.similarEntries);
app.get('/query', routes.query);
app.get('/new', routes.newEntry);
app.post('/new', routes.submit);
app.get('/about', routes.about);
app.post('/delete', routes.deleteEntry);
app.post('/edit', routes.editEntry);
app.get('/fullquery', routes.fullQuery);
app.get('/graph', routes.graph);
app.get('/graphdata', routes.graphData);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
