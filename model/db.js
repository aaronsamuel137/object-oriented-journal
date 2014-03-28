var mongoose = require('mongoose');
var textSearch = require('mongoose-text-search');

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

// give our schema text search capabilities
// UserSchema.plugin(textSearch);
EntrySchema.plugin(textSearch);

// add a text index to the tags array
// UserSchema.index({ entries: 'text' });
EntrySchema.index({ '$**': 'text' });

mongoose.model('User', UserSchema);
mongoose.model('Entry', EntrySchema);

// connect to mongo server
mongoose.connect('mongodb://localhost/journal');
console.log('connected to mongo database');
