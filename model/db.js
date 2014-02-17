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

var symbol = {
    types: {
        'judgment': ['toward', 'trigger', 'reason'],
        'reaction': ['toward', 'trigger', 'reason'],
        'intention': ['to', 'by', 'because']
    },
    names: [
        'judgment',
        'reaction',
        'intention'
    ]
};

mongoose.model('UserSchema', UserSchema);
mongoose.model('EntrySchema', EntrySchema);

mongoose.connect('mongodb://localhost/wakeup');
console.log('connected to database');

// var User = mongoose.model('UserSchema', UserSchema);
// var me = new User({ name: 'aaron', password: 'hello', symbol: symbol, entries: [] });
// console.log(me.id);
// me.save( function (err) {

//     if (err)
//         return;
//     console.log('Saved');

//     // User.find().all(function(user) {
//     //     console.log('beep');
//     // });
// });