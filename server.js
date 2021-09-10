"use strict";
require("dotenv").config();
const express = require("express");
const myDB = require("./connection");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const pug = require("pug");
const mongodb = require("mongodb");
const app = express();

const http = require("http").createServer(app);
const io = require("socket.io")(http);

const auth = require("./auth");
const routes = require("./routes");

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
  
  io.on('connection', socket => {
    console.log('A user has connected')
  })
}).catch(e => {
  app.route("/").get((req, res) => {
    res.render("pug", { title: e, message: "Unable to login" });
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});
