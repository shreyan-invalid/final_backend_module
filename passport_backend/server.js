const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const passportLocal = require("passport-local").Strategy;
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const bodyParser = require("body-parser");
const MongoDBStore= require('connect-mongodb-session')(session);


const app = express();
const User = require("./user");
const fetch = require('node-fetch');
const SECRET_KEY = "6LdFmGsbAAAAAInWLdijAFEf_gD968l6Wh5NGMZE";
const store= new MongoDBStore({
  uri: 'mongodb+srv://testUser2:12345@cluster0.typyf.mongodb.net/authentication?retryWrites=true&w=majority',
  collection: 'sessions'
});

//----------------------------------------- END OF IMPORTS---------------------------------------------------
mongoose.connect(
  "mongodb+srv://testUser2:12345@cluster0.typyf.mongodb.net/authentication?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  () => {
    console.log("Mongoose Is Connected");
  }
);

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:3000", // <-- location of the react app were connecting to
    credentials: true,
  })
);
app.use(
  session({
    name: "current-session",
    secret: "secretcode",
    resave: true,
    saveUninitialized: true,
    store: store,
    resave: false,
    cookie: {
      sameSite: true,

    }
  })
);
app.use(cookieParser("secretcode"));
app.use(passport.initialize());
app.use(passport.session());
require("./passportConfig")(passport);

//----------------------------------------- END OF MIDDLEWARE---------------------------------------------------

// Routes
app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) throw err;
    if (!user) res.send(info);
    else {
      req.logIn(user, (err) => {
        if(user){
          req.session.user= user;
        }
        if (err) throw err;
        res.send(true);
      });
    }
  })(req, res, next);
});


app.post("/register", (req, res) => {
  User.findOne({ email: req.body.email }, async (err, doc) => {
    if (err) throw err;
    if (doc) res.send("User Already Exists");
    if (!doc) {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);

      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword,
        session: 0
      });
      await newUser.save();
      res.send("User Created");
    }
  });
});

app.post('/verify', (req, res) => {
  const VERIFY_URL = `https://www.google.com/recaptcha/api/siteverify?secret=${SECRET_KEY}&response=${req.body['g-recaptcha-response']}`;
  return fetch(VERIFY_URL, { method: 'POST' })
    .then(res => res.json())
    .then(json => res.send(json));
});
 

app.get("/user", (req, res) => {
  res.send(req.user); // The req.user stores the entire user that has been authenticated inside of it.
});


app.get('/logout', async(req, res) => {
  const currUser= await User.findOne({_id: req.user.id});

  currUser.session= currUser.session - 1;
  await currUser.save();
  if(req.session.user){
    req.session.destory(err => {
      if(err) throw (err);
      req.logout();
      res.clearCookie('current-session');
      res.send('You are logged out');
    })
  }else{
    throw new Error('Something went wrong!');
  }
 
});
//----------------------------------------- END OF ROUTES---------------------------------------------------
//Start Server




app.listen(5000, () => {
  console.log("Server Has Started");
});