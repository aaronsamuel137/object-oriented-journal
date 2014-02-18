var mongoose = require('mongoose');

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

mongoose.connect('mongodb://localhost/wakeup');
console.log('connected to database');
