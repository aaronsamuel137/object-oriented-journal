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

exports.index = function(req, res){
  renderMain(res);
};

exports.submit = function(req, res) {

  // get parameters and create entry object
  var data = req.body;
  var type = data.type;
  delete data.type;
  console.log(data);
  var entry = new Entry({ type: type , date: new Date(), data: data });

  // retrieve user from database
  var name = "aaron";
  User.findOne({name: name}, function (err, user) {

    // add posted entry to db
    if (user) {
      console.log(user.symbol.names);
      if (!user.symbol.names.contains(type)) {
        user.symbol.names.push(type);
        console.log('pushed new type');
        var tmp = new Array();
        for(var name in data) {
          // var value = data[name];
          tmp.push(name);
        }
        user.symbol.types[type] = tmp;
        console.log(user.symbol.types);
      }

      user.entries.push(entry);
      user.save(function (err) {
        if (!err) {
          console.log('Entry added successfully.');
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
