Barcelona Startup Map
=====================

bcnstartupmap started as an introduction to node.js session. It demonstrated how to set up a simple Express 3 node.js app with a few libraries, GET, POST and an AJAX request. A CouchDB is required to run the demo.

### CouchDB view: startups/view 
    function(doc) {
      if(doc.jsonType == 'startup') {
        emit(doc.name, doc);
      }
    }

Integrating authentication with passport.js
-------------------------------------------

### Setup
    hash = function (pass, salt) {
      var h = crypto.createHash('sha512');
      h.update(pass);
      h.update(salt);
      return h.digest('base64');
    };
    
    app.response.message = function(type, msg){
      // reference req.session via the this.req reference
      var sess = this.req.session;
      // simply add the msg to an array for later
      sess.messages = sess.messages || [];
      sess.messages.push(msg);
      return this;
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

### Add messages middleware
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

### Add this below express.session
    app.use(passport.initialize());
    app.use(passport.session());

### Add routes
    app.get('/login', routes.login);
    app.get('/logout', function(req, res) { req.logOut(); res.redirect('/'); });
    app.get('/signup', routes.signup);
    app.post('/signup', routes.register);
    app.post('/login',
      passport.authenticate('local', { successRedirect: '/',
                                       failureRedirect: '/login',
                                       failureFlash: true })
    );

### Add authentication middleware
    function ensureAuthenticated(req, res, next) {
      if (req.isAuthenticated()) { return next(); }
      res.redirect('/login')
    }

### Create login.html view
    <form action="/login" method="post">
        <div>
        <label>Username:</label>
        <input type="text" name="username"/><br/>
        </div><div>
        <label>Password:</label>
        <input type="password" name="password"/>
        </div><div>
        <input type="submit" value="Log In"/>
        </div>
    </form>
    <a href="/signup">No account? Sign up.</a>

### Create signup.html
    <form action="/signup" method="post">
        <div>
        <label>Username:</label>
        <input type="text" name="username"/><br/>
        </div><div>
        <label>Password:</label>
        <input type="password" name="password"/>
        </div><div>
        <input type="submit" value="Sign up"/>
        </div>
    </form>
    <a href="/login">Already registered? Login.</a>

### Modify layout.html
    <% if (hasMessages) { %>
      <ul id="messages">
        <% messages.forEach(function(msg){ %>
          <li class="<%= msg.type %>"><%= msg.msg %></li>
        <% }) %>
      </ul>
    <% } %>

### Encrypt passwords
    var crypto = require('crypto');
    
    hash = function (pass, salt) {
      var h = crypto.createHash('sha512');
    
      h.update(pass);
      h.update(salt);
    
      return h.digest('base64');
    };

### Route functions
    exports.login = function(req, res) {
      res.render('login');
    }
    
    exports.findByUsername = function(username, callback) {
      db.get('user:'+username, function(error, result) {
        callback(null, result);
      });
    }
    
    exports.signup = function(req, res) {
      res.render('signup');
    }
    
    exports.register = function(req, res) {
      var user = {
        jsonType: 'user',
        username: req.body.username,
        password: hash(req.body.password, req.body.username),
        created_at: new Date(),
        updated_at: new Date()
      };
      db.insert(user, 'user:'+user.username, function(error, result) {
        console.log(error, result);
        req.logIn(user, function(error) {
          console.log(error);
          res.redirect('/');
        });
      });
    }

Future Development
------------------
Please feel free to fork and contribute to this project so we can generate a full map of startups in Barcelona on a  production-ready node.js service.


Services
--------
The demo uses a CouchDB provided by [iriscouch](http://iriscouch.com/) and [MapBox](http://mapbox.com) for map services.