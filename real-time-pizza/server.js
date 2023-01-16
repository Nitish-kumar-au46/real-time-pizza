require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const expressLayout = require("express-ejs-layouts");
const app = express();
const path = require("path");
const serverPort = process.env.PORT || 3300;
const mongoose = require("mongoose");
const session = require("express-session");
const flash = require("express-flash");
const MongoDbStore = require("connect-mongo");
const passport = require("passport");
const Emitter = require("events");

mongoose.set("strictQuery", false);

// database connection

mongoose
  .connect(process.env.MONGO_CONNECTION_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Database connected successfully...");
  })
  .catch((err) => {
    console.log("connection failed...");
  });

// Event emitter

const eventEmitter = new Emitter();
app.set("eventEmitter", eventEmitter);

// session configuration

app.use(
  session({
    secret: process.env.SECRET_KEY,
    resave: false,
    store: MongoDbStore.create({
      mongoUrl: process.env.MONGO_CONNECTION_URL,
    }),
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 },
  })
);

// passport configuration

const passportInit = require("./app/config/passport");
passportInit(passport);
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use((req, res, next) => {
  res.locals.session = req.session;
  res.locals.user = req.user;
  next();
});

app.use(expressLayout);
app.set("views", path.join(__dirname, "/resources/views"));
app.set("view engine", "ejs");

// routes inisilization
require("./routes/web")(app);

// wrong route going for error show code
app.use((req, res) => {
  res.status(404).render("errors/404");
});
// server connected method

const server = app.listen(serverPort, () => {
  console.log(`listening on port ${serverPort}`);
});

// socket.io(real time chat) code here

const io = require("socket.io")(server);
io.on("connection", (socket) => {
  // join code a client
  socket.on("join", (orderId) => {
    socket.join(orderId);
  });
});

eventEmitter.on("orderUpdated", (data) => {
  io.to(`order_${data.id}`).emit("orderUpdated", data);
});

eventEmitter.on("orderPlaced", (data) => {
  io.to("adminRoom").emit("orderPlaced", data);
});
