var mongoose = require('mongoose')
var Entry = mongoose.model('Entry');
var User = mongoose.model('User');
var ObjectId = mongoose.Types.ObjectId;

var pg = require('pg');
var connectionString = "/tmp wakeup";

Array.prototype.contains = function(k) {
  for (p in this)
    if (this[p] === k)
      return true;
  return false;
}

function renderMain(req, res) {
  res.render('index', {
    title: 'Wake UP',
    pagetitle: 'Wake UP',
    name: req.session.name,
    scripts: ['//code.jquery.com/jquery-1.10.1.min.js', '//code.jquery.com/ui/1.10.4/jquery-ui.js', '/js/complete.js']
  });
}

function deleteEntry() {
  User.find({ name: 'aaron' }).remove(function() {
    console.log('removed');
  });
}

function addUser(req) {
  var req_data = req.body;

  // add user to mongodb
  var symbol = {
    types: {},
    names: []
  }
  var user = new User({ name: req_data.username, symbol: symbol, entries: [] });
  var mongo_id = user.id;
  console.log('new user: ' + user.id);
  user.save( function (err) {
    if (err)
      return;
    console.log('Saved');
  });

  // add user to postgres
  console.log('about to add to pg');
  pg.connect(connectionString, function(err, client, done) {
    if (err) {
      console.log(err);
    } else {
      client.query(
        'INSERT INTO users (name, email, password, created_at, mongo_id) VALUES ($1, $2, $3, $4, $5);',
        [
          req_data.username,
          req_data.email,
          req_data.password,
          new Date(),
          mongo_id
        ],
        function(err, result) {
          if (err) {
            console.log('query error: ' + err);
          } else {
            console.log('result of insert %j', result);
            req.session.name = req_data.name;
            req.session.mongo_id = mongo_id;
            renderMain()
          }
          done();
        }
      );
    }
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
  delete data.type;

  console.log('data is %j', data);
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

        if (!user.symbol.types) {
          user.symbol.types = {};
        }
        user.symbol.types[type] = [];
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

exports.login = function(req, res) {
  // deleteEntry();
  res.render('login', {
    title: 'Wake UP',
    pagetitle: 'Log in',
    scripts: ['//code.jquery.com/jquery-1.10.1.min.js', '//code.jquery.com/ui/1.10.4/jquery-ui.js']
  });
}

exports.loginPost = function(req, res) {
  var req_data = req.body;
  pg.connect(connectionString, function(err, client, done) {
    if (err) {
      console.log(err);
    } else {
      client.query(
        'SELECT name, mongo_id FROM users WHERE email = $1 AND password = $2',
        [
          req_data.email,
          req_data.password,
        ],
        function(err, result) {
          if (err) {
            console.log(err);
          }
          console.log('results are %j', result);
          req.session.name = result.rows[0].name;
          req.session.mongo_id = result.rows[0].mongo_id;
          renderMain(req, res);
          done();
        }
      );
    }
  });
}

exports.signup = function(req, res) {
  // var data = req.body;
  addUser(req);
  // res.send('success!');
}

exports.data = function(req, res) {
  var mongo_id = new ObjectId(req.session.mongo_id);
  console.log(mongo_id);
  console.log(req.session.name);
  User.findOne({"_id": mongo_id}, function (err, user) {
    if (err) {
      console.log(err);
    } else {
      console.log('user is %j', user);
      res.send(user.symbol);
    }
  });
}
