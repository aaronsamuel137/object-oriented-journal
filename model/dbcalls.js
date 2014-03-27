
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
