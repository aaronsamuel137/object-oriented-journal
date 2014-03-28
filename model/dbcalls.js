
/**
 * This file keeps all the code that interacts with any of the databases
 * in one place.
 */

// vars needed for mongo
var mongoose = require('mongoose');
var Entry = mongoose.model('Entry');
var User = mongoose.model('User');
var ObjectId = mongoose.Types.ObjectId;

// vars neeed for postgres
var pg = require('pg');
var connectionString = "/tmp journal"; // where the sockect connection is to postgres


/**
 * Create a new user in the mongo database.
 * Return the mongo id so it can be used in creating the user in the postgres DB.
 */
exports.addUserToMongo = function(username) {
  // The symbol property of a user in the mongo data base is used to keep
  // track of all categories and sub-categories that the user has journaled about.
  // Names is a list of all category names, types are objects which hold arrays
  // of sub-category names
  var symbol = {
    types: {},
    names: []
  };

  // Create a new user object and save to mongo
  var user = new User({
    name: username,
    symbol: symbol,
    entries: []
  });

  user.save(function (err) {
    if (err)
      console.log('Error adding user %s to mongo', username);
    else
      console.log('Saved user %s to mongo', username);
  });

  return user.id;
}

/**
 * Add the user to the postgres users table. Redirect them back to the
 * login page and tell them to log in.
 */
exports.addUserToPostgres = function(req, res, mongo_id) {
  var params = req.body;

  pg.connect(connectionString, function(err, client, done) {
    if (err) {
      console.log('Error occured while connecting to postgres %s', err);
    } else {
      client.query(
        'INSERT INTO users (name, email, password, created_at, mongo_id) VALUES ($1, $2, $3, $4, $5);',
        [
          params.username,
          params.email,
          params.password,
          new Date(),
          mongo_id
        ],
        function(err, result) {
          if (err) {
            console.log('Error occured while inserting user into postgres user table %s', err);
          } else {
            console.log('User inserted into postgres user table with result: %j', result);
            done();

            var msg = 'Account created successfully! Login with your email and password to use the site.'
            renderLogin(res, msg);
          }
        }
      );
    }
  });
}

/**
 * Looks up user in the postgres users table, creates a session to keep the user
 * logged in, and redirects to the main page. If invalid information is given,
 * asks the user to try again,
 */
exports.login = function(req, res) {
  var params = req.body;

  pg.connect(connectionString, function(err, client, done) {
    if (err) {
      console.log('Error connecting to postgres user %s', err);
    } else {
      client.query(
        'SELECT name, mongo_id FROM users WHERE email = $1 AND password = $2',
        [
          params.email,
          params.password,
        ],
        function(err, result) {
          if (err) {
            console.log('Error logging in user %s', err);
          } else if (result.rowCount === 0) {
            var msg = 'Email address/password combination not found<br>' +
                      'Try again or create a new account';
            renderLogin(res, msg);
          } else {
            req.session.name = result.rows[0].name;
            req.session.mongo_id = result.rows[0].mongo_id;
            done();
            res.redirect('/');
          }
        }
      );
    }
  });
}

/**
 * Add a new entry to the mongo database. The entry is saved in the user's
 * document, as well as in a separate collection that holds just entries.
 */
exports.submitEntry = function(req, res, data, type) {

  // create new entry object with user's mongo id and entry data
  var mongo_id = new ObjectId(req.session.mongo_id);
  var entry = new Entry({
    type: type,
    date: new Date(),
    data: data,
    user: mongo_id
  });

  // retrieve user from database
  User.findOne({'_id': mongo_id}, function (err, user) {

    if (user) {
      // if a new name is added, update the symbol object
      if (type && !user.symbol.names.contains(type)) {

        user.symbol.names.push(type); // add new category name to names array

        if (!user.symbol.types) {
          user.symbol.types = {};
        }
        user.symbol.types[type] = []; // add new array for holding sub-categories
      }

      // fill in the sub-categories
      for (var name in data)
        if (name && !user.symbol.types[type].contains(name))
          user.symbol.types[type].push(name);

      user.markModified('symbol');

      // save changes to users document
      user.entries.push(entry);
      user.save(function (err, doc) {
        if (!err) {
          console.log('Entry added successfully.\n %j', doc.symbol);
        } else {
          console.log("Mongoose couldn't save entry: " + err);
        }
      });

      // save another copy of the entry as its own document
      entry.save(function(err, doc) {
        if (!err) {
          console.log('Entry added successfully.\n %j', doc.symbol);
        } else {
          console.log("Mongoose couldn't save entry: " + err);
        }
      });
    }

    // render page
    msg = 'Success! Entry has been added.'
    renderHome(req, res, msg);
  });
}

/**
 * JSON endpoint with the entire user document for the given mongo id
 */
exports.renderUserJSON = function(mongo_id, res) {
  User.findOne({"_id": mongo_id}, function (err, user) {
    if (err) {
      console.log(err);
    } else {
      res.send(user.symbol);
    }
  });
}

/**
 * JSON endpoint with all entries of the same type as query for the user
 * with the given mongo_id
 */
exports.renderSimilarEntries = function(mongo_id, query, res) {
  User.findOne({"_id": mongo_id}, function (err, user) {
    if (err) {
      console.log('Error: %s', err);
    } else {
      if (user && user.entries) {
        var queriedEntries = [];
        user.entries.forEach(function(entry) {
          if (entry.type == query.type) {
            queriedEntries.push(entry);
          }
        });
        res.send(queriedEntries);
      } else {
        res.send('');
      }
    }
  });
}

exports.renderQueryJSON = function(mongo_id, params, res) {
  var query = params.query;
  var queryby = params.queryby;

  User.findOne({"_id": mongo_id}, function (err, user) {
    if (err) {
      console.log('Error: %s', err);
    } else {
      if (user && user.entries) {
        var queriedEntries = [];
        user.entries.forEach(function(entry) {
          if (entry.type == query.type) {
            queriedEntries.push(entry);
          }
        });
        res.send(queriedEntries);
      } else {
        res.send('');
      }
    }
  });
}

/**
 * Delete an entry from the entries collection
 */
exports.deleteEntry = function(entryID) {
  var deleteEntryQuery = Entry.findOne({'_id': entryID});
  var deletePromise = deleteEntryQuery.remove().exec();
}

/**
 * Edit an entry from the entries collection by replacing its contents
 * with the entryData object
 */
exports.editEntry = function(entryID, entryData) {
  Entry.findOne({'_id': entryID}, function (err, entry) {
    if (err) {
      console.log('error: %s', err);
    } else if (entry) {
      console.log('entry is %j', entry);
      entry.data = entryData;
      entry.markModified('data');
      entry.save(function (err) {
        if (err)
          return;
        console.log('Saved');
      });
    }
  });
}

/**
 * Delete an entry from the user's entry array. Remove this entry type from
 * the symbol object if there are no more entries of this type left.
 */
exports.deleteEntryFromUser = function(mongo_id, entryID) {
  var deleteUsersEntry = User.findOne({'_id': mongo_id});
  var deleteUsersEntryPromise = deleteUsersEntry.exec();

  deleteUsersEntryPromise.then(function(doc) {
    var modified = false;     // set to true if user document is modified
    var stillInTypes = false; // set to true if the deleted document type still exists in the user's entries
    var name = null;          // name of the type of the entry that is being deleted

    // loop through user's entries to see if this entry is there, and delete it if it is
    for (var i = 0; i < doc.entries.length; i++) {
      if (doc.entries[i]._id == entryID) {
        name = doc.entries[i].type;
        doc.entries.splice(i, 1);
        modified = true;
        break;
      }
    }

    // loop through entries again to see if this type of entry still exists.
    // if not remove it from the symbol object
    if (name) {
      for (var i = 0; i < doc.entries.length; i++) {
        if (doc.entries[i].type === name) {
          stillInTypes = true;
          break;
        }
      }
    }

    if (!stillInTypes) {
      // remove from names array
      var idx = doc.symbol.names.indexOf(name);
      if (idx !== -1) {
        doc.symbol.names.splice(idx, 1);
        console.log('removing %s from names', name);
      }

      // remove from symbol types
      doc.symbol.types.name = undefined;
      doc.markModified('symbol');
    }

    // save the document if it was modified
    if (modified) {
      doc.save( function (err) {
        if (err)
          return;
        console.log('Saved user after deleting entry');
      });
    }

  }, function(err) {
    console.log('Error deleting entry from user: %s', err);
  });
}

/**
 * Edit an entry in the user's document. Update the symbol object if entry
 * sub-category names have changed.
 */
exports.editEntryInUser = function(mongo_id, entryID, entryData) {
  User.findOne({'_id': mongo_id}, function (err, user) {
    if (err) {
      console.log('Error finding user in editEntryInUser: %s', err);
    } else if (user && user.entries) {

      // loop over entry array until correct entry is found
      for (var i = 0; i < user.entries.length; i++) {
        if (user.entries[i]._id.equals(entryID)) {

          // replace entry data with edit
          user.entries[i].data = entryData;
          user.markModified('entries');

          // update symbol object if the sub-categories have changed for this
          // type of entry
          var entryType = user.entries[i].type;
          if (user.symbol.types[entryType]) {
            var newTypeData = [];
            for (var key in entryData) {
              newTypeData.push(key);
            }
            user.symbol.types[entryType] = newTypeData;
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
      console.log('User not found or has no entries');
    }
  });
}

function renderLogin(res, msg) {
  res.render('login', {
    title: 'Object Oriented Journal',
    message: msg,
  });
}

function renderHome(req, res, msg) {
  res.render('index', {
    title: 'Object Oriented Journal',
    name: req.session.name,
    msg: msg
  });
}

Array.prototype.contains = function(k) {
  for (var p in this)
    if (this[p] === k)
      return true;
  return false;
};
