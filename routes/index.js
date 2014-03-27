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
  var req_data = req.body;
  pg.connect(connectionString, function(err, client, done) {
    if (err) {
      console.log(err);
    } else {
      client.query(
        'SELECT name, mongo_id FROM users WHERE email = $1 AND password = $2',
        [
          req_data.email,
          req_data.password,
        ],
        function(err, result) {
          if (err) {
            console.log(err);
          } else if (result.rowCount === 0) {
            var msg = 'Email address/password combination not found<br>' +
                      'Try again or create a new account';
            renderLogin(res, msg);
          } else {
            console.log('results are %j', result);
            req.session.name = result.rows[0].name;
            req.session.mongo_id = result.rows[0].mongo_id;
            console.log('about to render main, req is %j', req.session)
            done();
            res.redirect('/');
          }
        }
      );
    }
  });
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
  User.findOne({"_id": mongo_id}, function (err, user) {
    if (err) {
      console.log(err);
    } else {
      console.log('user is %j', user);
      res.send(user.symbol);
    }
  });
};

exports.similarEntries = function(req, res) {
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;
  var mongo_id = new ObjectId(req.session.mongo_id);

  User.findOne({"_id": mongo_id}, function (err, user) {
    if (err) {
      console.log('error: %s', err);
    } else {
      if (user && user.entries) {
        var queriedEntries = [];
        user.entries.forEach(function(entry) {
          if (entry.type == query.type) {
            queriedEntries.push(entry);
            console.log('entry pushed');
          }
          console.log('entry: %j', entry);
        });
        res.send(queriedEntries);
      } else {
        res.send('');
      }
    }
  });
};

exports.deleteEntry = function(req, res) {
  var data = req.body;
  var entryID = data.entryID;
  var mongo_id = new ObjectId(req.session.mongo_id);

  console.log('query is %j', data);
  console.log('delete called with id %s', entryID);

  var deleteEntryQuery = Entry.findOne({'_id': entryID});
  var deletePromise = deleteEntryQuery.remove().exec();

  var deleteUsersEntry = User.findOne({"_id": mongo_id});
  var deleteUsersEntryPromise = deleteUsersEntry.exec();

  deleteUsersEntryPromise.then(function(doc) {
    console.log('document is %j', doc);

    var modified = false;
    var stillInTypes = false;
    var name = null;
    for (var i = 0; i < doc.entries.length; i++) {

      if (doc.entries[i]._id == entryID) {
        console.log('splicing');
        name = doc.entries[i].type;
        doc.entries.splice(i, 1);
        modified = true;
        break;

      } else {
        console.log('not found');
      }
    }

    if (name) {
      console.log('name is %s', name);
      for (var i = 0; i < doc.entries.length; i++) {
        if (doc.entries[i].type === name) {
          stillInTypes = true;
          break;
        }
      }
    }

    console.log(stillInTypes);
    console.log(modified);

    if (modified) {
      if (!stillInTypes) {
        console.log('removing from symbol');

        // remove from names array
        var idx = doc.symbol.names.indexOf(name);
        console.log('index is ' + idx);
        if (idx !== -1) {
          doc.symbol.names.splice(idx, 1);
          console.log('removing %s from names', name);
        }

        // remove from symbol types
        console.log('deleting... ?');
        doc.symbol.types.name = undefined;

        doc.markModified('symbol');
        // doc.markModified('symbol.types');
      }

      doc.save( function (err) {
        if (err)
          return;
        console.log('Saved');
      });
    }

  }, function(err) {
    console.log('error: %s', err);
  });

  res.send('');
};

exports.editEntry = function(req, res) {
  var data = req.body;
  console.log('params are %j', data);

  var entryID = new ObjectId(data.entryID);
  delete data.entryID;
  var mongo_id = new ObjectId(req.session.mongo_id);

  console.log('entry ID is ' + entryID);


  Entry.findOne({'_id': entryID}, function (err, entry) {
    if (err) {
      console.log('error: %s', err);
    } else if (entry) {
      console.log('entry is %j', entry);
      entry.data = data;
      entry.markModified('data');
      entry.save(function (err) {
        if (err)
          return;
        console.log('Saved');
      });
    }
  });

  var oldEntry;
  User.findOne({'_id': mongo_id}, function (err, user) {
    if (err) {
      console.log('error: %s', err);
    } else if (user && user.entries) {
      console.log('user found');

      for (var i = 0; i < user.entries.length; i++) {
        if (user.entries[i]._id.equals(entryID)) {
          console.log('found entry!');
          console.log('entry: %j', user.entries[i]);
          oldEntry = user.entries[i];
          user.entries[i].data = data;
          user.markModified('entries');

          var dataType = user.entries[i].type;

          console.log('data type is: %j', dataType);
          console.log('symbol type is: %j', user.symbol.types[dataType]);

          if (user.symbol.types[dataType]) {
            console.log('symbol type is: %j', user.symbol.types[dataType]);
            var newTypeData = [];
            for (var key in data) {
              newTypeData.push(key);
            }
            console.log('newTypeData: %j', newTypeData);
            user.symbol.types[dataType] = newTypeData;
            user.markModified('symbol');
          }

          user.save(function (err) {
            if (err)
              return;
            console.log('Saved in user');
          });
          break;
        }
      }

    } else {
      console.log('nothing happened in user findOne');
    }
  });

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
