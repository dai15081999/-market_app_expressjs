const express = require("express");
require("dotenv").config();
const app = express();
const ejs = require("ejs");
const expressLayout = require("express-ejs-layouts");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const flash = require("express-flash");
const MongoDbStore = require("connect-mongo")(session)
const passport = require('passport')
const Emitter = require('events')
const cors = require('cors')


// connect db
function DbConnect() {
  mongoose.connect(process.env.DB_URL, async (err) => {
    if (err) throw err;
    console.log("conncted to db");
  });

  mongoose.connection.on("connected", () => {
    console.log("db connected...");
  });

  mongoose.connection.on("error", () => {
    console.log("db error...");
  });

  mongoose.connection.on("disconnected", () => {
    console.log("db disconnected...");
  });

  process.on("SIGINT", async () => {
    await mongoose.connection.close();
    process.exit(0);
  });
}
DbConnect();
//done connected db

let PORT;
if (process.env.PORT) {
  PORT = process.env.PORT;
} else {
  PORT = 3000;
}

//session store
let mongoStore = new MongoDbStore({
  mongooseConnection: mongoose.connection,
  collection: "sessions",
});
// emitter event
const eventEmitter = new Emitter()
app.set('eventEmitter', eventEmitter)
app.use(cors())
// Session
app.use(
  session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 },
    store: mongoStore,
  })
)

// passport config
const passportInit = require('./app/config/passport')
passportInit(passport)
app.use(passport.initialize())
app.use(passport.session())

app.use(flash());
app.use(express.json())
app.use(express.urlencoded({extends: false}))

// middlewares
app.use((req, res, next) => {
  res.locals.session = req.session
  res.locals.user = req.user
  next()
})

// set Template engine
app.use(expressLayout);
app.set("views", path.join(__dirname, "/resources/views"));
app.set("view engine", "ejs");
app.use(express.static("public"));



require("./routes/web")(app);

const server = app.listen(PORT, () => {
  console.log("hello server...");
});

//socket
const io = require('socket.io')(server)
io.on('connection', (socket) => {
  socket.on('join', (orderId) => {
    socket.join(orderId)
  })
})

eventEmitter.on('orderUpdated', (data) => {
  io.to(`order_${data.id}`).emit('orderUpdated', data)
})

eventEmitter.on('orderPlaced', (data) => {
  io.to('adminRoom').emit('orderPlaced', data)
})
