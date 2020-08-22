const express = require("express");
const redis = require("redis");
const session = require("express-session");
const router = express.Router();
/**
 * Importing Two Functions From rate-limiter.js File :
 * 1. Token Bucket
 * 2. Sliding Window
 */ 
const { TokenBucket, SlidingWindow } = require("../middlewares/rate-limiter.js");
const client = redis.createClient();

client.on("connect", function () {
  console.log("Connected to Redis...");
});

//Registering the session with it's secret ID
router.use(
  session({
    secret: "cookie_secret",
    proxy: true,
    resave: true,
    saveUninitialized: true,
  })
);

/**
 * GET REQUEST TO RENDER: 
 * This will redirect the user to the index/home page if the user has logged in.
 * */
router.get("/", function (req, res, next) {
  if (req.session.username) {
    client.hgetall(req.session.username, function (err, user) {
      if (err) res.render("error", {message: "There is a Database Error. Please Try Again "});
      res.render("index", { user: user });
    });
  } else res.render("login",{error:"Please Log In"});
});

/**
 * GET REQUEST TO RENDER: 
 * This route will render the signup page.
 * */
router.get("/signup", function (req, res, next) {
  res.render("signup", { title: "Sign Up Page",error:False });
});

/**
 * GET REQUEST TO RENDER: SIGNUP PAGE
 * */
router.get("/login", function (req, res, next) {
  res.render("login", { title: "Login Page" ,error:False});
});

/**
 * POST REQUEST TO SIGNUP THE USER :
 * This route will get the details of the user from the body of the request object.
 * Then it add the user to the database if the user doesn't exist.
 *
 * */
router.post("/signup", function (req, res, next) {
  if (req.body.developers == "") var developers = 10;
  else var developers = parseInt(req.body.developers);
  if (req.body.organizations == "") var organizations = 10;
  else var organizations = parseInt(req.body.organizations);
  if (req.body.employees == "") var employees = 10;
  else var employees = parseInt(req.body.employees);
  client.hmset(
    req.body.username,
    [
      "name",req.body.name,
      "password",req.body.password,
      "developers",developers,
      "organizations", organizations,
      "employees",employees,
      "algo",req.body.algo,
    ],
    function (err, user) {
      if (err) res.render("error", {message: "There is a Database Error. Please Try Again "})
      console.log("User Signed Up Successfully");
      req.session.username = req.body.username
      req.session.algo = req.body.algo
      res.redirect("/");
    }
  );
});

/**
 * POST REQUEST TO LOG THE USER IN:
 * It will redirect the user to the index page if the credentials of the user are correct.
 */
router.post("/login", function (req, res, next) {
  client.hgetall(req.body.username, function (err, user) {
    if (err) res.render("error", {message: "There is a Database Error. Please Try Again "})
    if (!user) {
      res.render("signup", {
        error: "You haven't Signed Up. Please Signup!",
      });
    } else {
      client.hgetall(req.body.username, function (err, user) {
        if (user.password == req.body.password) {
          req.session.username = req.body.username;
          req.session.algo = user.algo;
          console.log({ user });
          res.redirect("/");
        } else {
          res.render("login", {
            error: "Wrong Credentials. Please Try Again",
          });
        }
      });
    }
  });
});

/**
 * POST REQUEST TO LOG THE USER IN:
 * It will redirect the user to the index page if the credentials of the user are correct.
 */
router.post('/logout',function(req,res,next){
  req.session.destroy(function(err){
    if (err) res.render("error", {message: "There is a Database Error. Please Try to Logout again "})
    res.redirect('/login');
  });
})

/**
 * GET REQUEST TO RENDER: 
 * This will redirect the user to developers page if the user's api-rate limit hasn't exceeded.
 * */
router.get("/developers", function (req, res, next) {
  if (req.session.username) {
    if (req.session.algo == "Token Bucket Algorithm") {
      TokenBucket(req.session.username,"developers","pagelimitexced",res,client);
    } else {
      SlidingWindow(req.session.username,"developers","pagelimitexced",res,client);
    }
  } else res.redirect("/login");
});

/**
 * GET REQUEST TO RENDER: 
 * This will redirect the user to organisations page if the user's api-rate limit hasn't exceeded.
 * */
router.get("/organizations", function (req, res, next) {
  if (req.session.username) {
    if (req.session.algo == "Token Bucket Algorithm") {
      TokenBucket(req.session.username,"organizations","pagelimitexced",res,client);
    } else {
      SlidingWindow(req.session.username,"organizations","pagelimitexced",res,client);
    }
  } else res.redirect("/login");
});

/**
 * GET REQUEST TO RENDER: 
 * This will redirect the user to employees page if the user's api-rate limit hasn't exceeded.
 * */
router.get("/employees", function (req, res, next) {
  if (req.session.username) {
    if (req.session.algo == "Token Bucket Algorithm") {
      TokenBucket(req.session.username,"employees","pagelimitexced",res,client);
    } else {
      SlidingWindow(req.session.username,"employees","pagelimitexced",res,client);
    }
  } else res.redirect("/login");
});

module.exports = router;
