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
      cookie: { secure: false },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new GithubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL:
          "https://wtb-fcc-advanced-node-2021.glitch.me/auth/github/callback",
      },
      (accessToken, refreshToken, profile, cb) => {
        console.log(profile);

        myDataBase.findOneAndUpdate(
          { id: profile.id },
          {
            $setOnInsert: {
              id: profile.id,
              name: profile.displayName || "John Doe",
              photo: profile.photos[0].value || "",
              email: Array.isArray(profile.emails)
                ? profile.emails[0].value
                : "No public email",
              created_on: new Date(),
              provider: profile.provider || "",
            },
            $set: {
              last_login: new Date(),
            },
            $inc: {
              login_count: 1,
            },
          },
          { upsert: true, new: true },
          (err, doc) => {
            return cb(null, doc.value);
          }
        );
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
    new LocalStrategy(function (username, password, done) {
      myDataBase.findOne({ username: username }, function (err, user) {
        console.log("User " + username + " attempted to log in.");
        if (err) {
          console.log(err);
          return done(err);
        }
        if (!user) {
          console.log("no user found");
          return done(null, false);
        }
        if (!bcrypt.compareSync(password, user.password)) {
          console.log("wrong password : " + password + " - " + user.password);
          return done(null, false);
        }
        console.log(user);
        return done(null, user);
      });
    })
  );
};
