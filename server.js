"use strict";
require("dotenv").config();
const express = require("express");
const myDB = require("./connection");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const pug = require("pug");
const mongodb = require("mongodb");
const session = require("express-session");

const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const auth = require("./auth");
const routes = require("./routes");

const passportSocketIo = require("passport.socketio");
const cookieParser = require("cookie-parser");
const MongoStore = require("connect-mongo")(session);
const URI = process.env.MONGO_URI;
const store = new MongoStore({ url: URI });

fccTesting(app); //For FCC testing purposes
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "pug");
app.set("views/", "./views");

myDB(async client => {
  const myDataBase = await client.db("advancedNode2021").collection("users");

  auth(app, myDataBase);
  routes(app, myDataBase);

  let currentUsers = 0;

  io.use(
    passportSocketIo.authorize({
      cookieParser: cookieParser,
      key: "express.sid",
      secret: process.env.SESSION_SECRET,
      store: store,
      success: onAuthorizeSuccess,
      fail: onAuthorizeFail
    })
  );

  io.on("connection", socket => {
    ++currentUsers;
    console.log("A user has connected");

    io.emit("user count", currentUsers);

    socket.on("disconnect", () => {
      console.log("A user has disconnected");

      --currentUsers;

      io.emit("user count", currentUsers);
    });
  });
}).catch(e => {
  app.route("/").get((req, res) => {
    res.render("pug", { title: e, message: "Unable to login" });
  });
});

function onAuthorizeSuccess(data, accept) {
  console.log("successful connection to socket.io");

  accept(null, true);
}

function onAuthorizeFail(data, message, error, accept) {
  if (error) throw new Error(message);
  console.log("failed connection to socket.io:", message);
  accept(null, false);
}

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});
