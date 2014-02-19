var Entry = require('mongoose').model('EntrySchema');
var User = require('mongoose').model('UserSchema');

Array.prototype.contains = function(k) {
  for (p in this)
    if (this[p] === k)
      return true;
  return false;
}

function renderMain(res) {
  res.render('index', {
    title: 'Wake UP',
    pagetitle: 'Wake UP',
    scripts: ['//code.jquery.com/jquery-1.10.1.min.js', '//code.jquery.com/ui/1.10.4/jquery-ui.js', '/js/complete.js']
  });
}

function deleteEntry() {
  User.find({ name: 'aaron' }).remove(function() {
    console.log('removed');
  });
}

function addUser(name, password) {
  var symbol = {
    types: {},
    names: []
  }
  var user = new User({ name: name, password: password, symbol: symbol, entries: [] });
  console.log('new user: ' + user.id);
  user.save( function (err) {
    if (err)
      return;
    console.log('Saved');
  });
}

exports.index = function(req, res) {
  // deleteEntry();
  // addUser('aaron', 'hello');
  User.find({name: 'aaron'}, function (err, user) {
    console.log('user is:\n %j', user);
  });

  renderMain(res);
};

exports.submit = function(req, res) {

  // get parameters and create entry object
  var data = req.body;
  var type = data.type;
  console.log('data is %j', data);

  delete data.type;
  console.log(data);
  var entry = new Entry({ type: type , date: new Date(), data: data });

  // retrieve user from database
  var name = "aaron";
  User.findOne({name: name}, function (err, user) {
    console.log(user);
    console.log(type);

    // add posted entry to db
    if (user) {
      console.log('names are: ' + user.symbol.names);

      // if a new name is added, update the symbol object
      if (!user.symbol.names.contains(type)) {
        user.symbol.names.push(type);
        console.log('pushed new name');

        user.symbol.types = {};
        user.symbol.types[type] = [];
        // var tmp = new Array();
        // for (var name in data) {
        //   // var value = data[name];
        //   tmp.push(name);
        // }
        // if (user.symbol.types) {
        //   user.symbol.types[type] = tmp;
        // } else {
        //   user.symbol.types = {};
        //   user.symbol.types[type] = tmp;
        // }
        console.log('added new type');
      }

      for (var name in data) {
        if (!user.symbol.types[type].contains(name)) {
          user.symbol.types[type].push(name);
          console.log('pushing new name ' + name + ' into type object');
        } else {
          console.log('didnt push ' + name)
        }
      }

      user.markModified('symbol');
      // user.markModified('symbol.names');

      console.log('user is:\n %j', user.symbol);

      user.entries.push(entry);
      user.save(function (err, doc) {
        if (!err) {
          console.log('Entry added successfully.\n %j', doc.symbol);
        } else {
          console.log("Mongoose couldn't save entry: " + err);
        }
      });
    }

    // render page
    renderMain(res);
  });
};

exports.data = function(req, res) {
  User.findOne({name: 'aaron'}, function (err, user) {
    res.send(user.symbol);
  });
}
