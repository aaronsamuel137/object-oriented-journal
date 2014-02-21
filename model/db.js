var mongoose = require('mongoose');
var pg = require('pg');

// mongo schemas
var UserSchema = new mongoose.Schema({
  name: String,
  password: String,
  symbol: {
    types: {},
    names: []
  },
  entries: [ EntrySchema ]
});

var EntrySchema = new mongoose.Schema({
  type: String,
  date: Date,
  data: {}
});

mongoose.model('UserSchema', UserSchema);
mongoose.model('EntrySchema', EntrySchema);

// connect to mongo server
mongoose.connect('mongodb://localhost/wakeup');
console.log('connected to mongo database');

// connect to postgres server
// var conString = "postgres://YourUserName:YourPassword@localhost:5432/YourDatabase";
// var conString = "postgres://postgres:5432@localhost/wakeup";

var conString = "/tmp/.s.PGSQL.5432/";

// module.exports = {
//    query: function(text, values, cb) {
//       pg.connect(function(err, client, done) {
//         client.query(text, values, function(err, result) {
//           done();
//           cb(err, result);
//         })
//       });
//    }
// }


