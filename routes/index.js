var nano = require('nano')('http://youririscouch:5984')
  , db = nano.db.use('startups')
  , async = require('async');

exports.index = function(req, res) {
  res.render('index');
};

exports.new = function(req, res) {
  res.render('startups/create');
};

exports.locations = function(req, res) {
  db.view('startups', 'index', function(error, result) {
    var startups = [];
    async.forEach(result.rows, function(row, callback) {
      var startup = {
        "geometry": { "type": "Point" },
        "properties": { 
          'marker-color': '#000',
          'marker-symbol': 'star-stroked',
        }
      };
      startup.geometry.coordinates = [row.value.location[1], row.value.location[0]];
      startup.properties.title = row.value.name;
      startup.properties.address = row.value.address;
      startup.properties.description = row.value.description;
      startups.push(startup);
      callback(null, startups)
    }, function(error) {
      console.log('done');
      if(!error) {
        res.json(startups);
      } else {
        res.json([]);
      }
    });
  });
}
exports.create = function(req, res) {
  var doc = {
    jsonType: "startup"
  };
  doc.name = req.body.startupname;
  doc.address = req.body.address;
  doc.location = [parseFloat(req.body.lat), parseFloat(req.body.lon)];
  doc.description = req.body.description;
  db.insert(doc, function(error, result) {
    if(!error) {
      res.render('startups/show', {startup: doc});
    } else {
      console.log(error, result);
    }
  });
}