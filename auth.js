const bcrypt = require("bcrypt");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const GithubStrategy = require("passport-github").Strategy;
const ObjectID = require("mongodb").ObjectID;
const session = require("express-session");

module.exports = (app, myDataBase) => {
  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: true,
      saveUninitialized: true,
      cookie: { secure: false }
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new GithubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: "/auith/github/callback"
      },
      (accessToken, refreshToken, profile, cb) => {
        console.log(profile);
      }
    )
  );
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });
  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      done(null, doc);
    });
  });

  passport.use(
    new LocalStrategy(function(username, password, done) {
      myDataBase.findOne({ username: username }, function(err, user) {
        console.log("User " + username + " attempted to log in.");
        if (err) {
          return done(err);
        }
        if (!user) {
          return done(null, false);
        }
        if (!bcrypt.compareSync(password, user.password)) {
          return done(null, false);
        }
        return done(null, user);
      });
    })
  );
};
