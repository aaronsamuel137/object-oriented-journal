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
  data: {},
  user: mongoose.Schema.Types.ObjectId
});

mongoose.model('User', UserSchema);
mongoose.model('Entry', EntrySchema);

// connect to mongo server
mongoose.connect('mongodb://localhost/journal');
console.log('connected to mongo database');
