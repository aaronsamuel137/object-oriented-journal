var mongoose = require('mongoose');

// mongo schemas
var UserSchema = new mongoose.Schema({
  name: String,
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

mongoose.model('User', UserSchema);
mongoose.model('Entry', EntrySchema);

// connect to mongo server
mongoose.connect('mongodb://localhost/wakeup');
console.log('connected to mongo database');
