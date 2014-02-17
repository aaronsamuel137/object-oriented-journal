var Entry = require('mongoose').model('EntrySchema');
var User = require('mongoose').model('UserSchema');

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
