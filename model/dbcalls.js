
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
  // Here, it is initialized to empty.
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

function renderLogin(res, msg) {
  res.render('login', {
    title: 'Object Oriented Journal',
    message: msg,
  });
}
