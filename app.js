
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , crypto = require('crypto')
  , partials = require('express-partials')
  , passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , path = require('path');

hash = function (pass, salt) {
  var h = crypto.createHash('sha512');
  h.update(pass);
  h.update(salt);
  return h.digest('base64');
};

passport.use(new LocalStrategy(
  function(username, password, done) {
    process.nextTick(function () {
      routes.findByUsername(username, function(err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
        if (user.password != hash(password, username)) { return done(null, false, { message: 'Invalid password' }); }
        return done(null, user);
      })
    });
  }
));

passport.serializeUser(function(user, done) {
  console.log('serialize', user);
  done(null, user.username);
});

passport.deserializeUser(function(username, done) {
  console.log('deserialize', username);
  routes.findByUsername(username, function (err, user) {
    done(err, user);
  });
});

var app = express();
app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.engine('.html', require('ejs').__express);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'html');
  app.use(partials());
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(function(req, res, next) {
    if(req.isAuthenticated()) {
      res.locals.user = req.user;
    }
    var msgs = req.session.messages || [];
    res.locals({
      messages: msgs,
      hasMessages: !! msgs.length
    });
    req.session.messages = [];
    next();
  });
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.response.message = function(type, msg){
  // reference req.session via the this.req reference
  var sess = this.req.session;
  // simply add the msg to an array for later
  sess.messages = sess.messages || [];
  sess.messages.push(msg);
  return this;
};

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/startups/add', ensureAuthenticated, routes.new);
app.get('/startups/locations', routes.locations);
app.post('/startups', routes.create);
app.get('/login', routes.login);
app.get('/logout', function(req, res) { req.logOut(); res.redirect('/'); });
app.get('/signup', routes.signup);
app.post('/signup', routes.register);
app.post('/login',
  passport.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/login',
                                   failureFlash: true })
);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
    res.redirect('/login')
}