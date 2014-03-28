var mongoose = require('mongoose');
var Entry = mongoose.model('Entry');
var User = mongoose.model('User');
var ObjectId = mongoose.Types.ObjectId;
var url = require('url');

var dbcalls = require('../model/dbcalls');

var pg = require('pg');
var connectionString = "/tmp journal"; // where the sockect connection is to postgres


function renderHome(req, res, msg) {
  res.render('index', {
    title: 'Object Oriented Journal',
    name: req.session.name,
    msg: msg
  });
}

function renderNewEntry(req, res) {
  res.render('new', {
    title: 'Object Oriented Journal',
    name: req.session.name,
    script: '/js/complete.js',
  });
}

function renderLogin(res, msg) {
  res.render('login', {
    title: 'Object Oriented Journal',
    message: msg,
  });
}

function addUser(req, res) {
  var username = req.body.username;

  var mongo_id = dbcalls.addUserToMongo(username);

  // add user to postgres and render the response once complete
  dbcalls.addUserToPostgres(req, res, mongo_id);
}

exports.home = function(req, res) {
  if (!req.session.name) {
    res.redirect('/login')
  } else {
    var msg = 'This is the prototype for object oriented journaling. ' +
              'Use the links on the navbar to add new entries or query your journal.';
    renderHome(req, res, msg);
  }
}

exports.newEntry = function(req, res) {
  if (!req.session.name) {
    res.redirect('/login')
  } else {
    renderNewEntry(req, res);
  }
};

exports.submit = function(req, res) {

  // get parameters
  var data = req.body;
  var type = data.type;
  delete data.type;

  // add new entry to database and render main page
  dbcalls.submitEntry(req, res, data, type);
};

exports.login = function(req, res) {
  if (req.session.name) {
    res.redirect('/');
  } else {
    var msg = 'Log in with your email and password, or create a new account';
    renderLogin(res, msg);
  }
};

exports.loginPost = function(req, res) {
  // login user by looking them up in the database and creating a session,
  // redirects to the main page
  dbcalls.login(req, res);
};

exports.signup = function(req, res) {
  var email_re = /\S+@\S+\.\S+/;
  var data = req.body;
  var msg;
  if (data.username.length < 1) {
    msg = 'Invalid username, must be at least 1 character long';
    renderLogin(res, msg);
  }
  else if (!email_re.test(data.email)) {
    msg = 'Invalid email, try again';
    renderLogin(res, msg);
  }
  else if (data.password.length < 5) {
    msg = 'Invalid password, must be at least 5 characters';
    renderLogin(res, msg);
  }
  else if (data.password !== data.repeat) {
    msg = 'Passwords do not match';
    renderLogin(res, msg);
  }
  else {
    addUser(req, res);
  }
};

exports.logout = function(req, res) {
  req.session.destroy();
  res.redirect('/')
}

// json endpoint for getting user data
exports.data = function(req, res) {
  var mongo_id = new ObjectId(req.session.mongo_id);
  dbcalls.renderUserJSON(mongo_id, res);
};

// json endpoint for entries of the same type as query
exports.similarEntries = function(req, res) {
  var urlData = url.parse(req.url, true);
  var params = urlData.query;
  var mongo_id = new ObjectId(req.session.mongo_id);

  dbcalls.renderSimilarEntries(mongo_id, params, res);
};

exports.fullQuery = function(req, res) {
  var urlData = url.parse(req.url, true);
  var params = urlData.query;
  var mongo_id = new ObjectId(req.session.mongo_id);

  dbcalls.renderQueryJSON(mongo_id, params, res);
}

// delete an entry from the user document and the entries collection
exports.deleteEntry = function(req, res) {
  var data = req.body;
  var entryID = data.entryID;
  var mongo_id = new ObjectId(req.session.mongo_id);

  // delete entry from entries collection
  dbcalls.deleteEntry(entryID);

  // delete entry from user's list
  dbcalls.deleteEntryFromUser(mongo_id, entryID);

  // render nothing, this is just an ajax call to delete the entry
  res.send('');
};

exports.editEntry = function(req, res) {
  var data = req.body;
  var entryID = new ObjectId(data.entryID);
  delete data.entryID;
  var mongo_id = new ObjectId(req.session.mongo_id);

  console.log('Editing entry ID %s', entryID);

  // edit entry in entries collection
  dbcalls.editEntry(entryID, data)

  // edit entry in user document
  dbcalls.editEntryInUser(mongo_id, entryID, data);

  // render nothing, page refreshes on front end
  res.send('');
}

exports.query = function(req, res) {
  if (!req.session.name) {
    res.redirect('/login');
  } else {
    res.render('query', {
      title: 'Object Oriented Journal',
      name: req.session.name,
      script: '/js/query.js',
    });
  }
}

exports.about = function(req, res) {
  res.render('about');
}
