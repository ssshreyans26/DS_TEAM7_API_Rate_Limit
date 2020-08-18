var express = require('express');
var redis = require('redis');
var session = require('express-session');
var router = express.Router();
var {TokenBucket,SlidingWindow} = require('../middlewares/rate-limiter.js');
let client = redis.createClient();

client.on('connect', function(){
  console.log('Connected to Redis...');
});

//Registering the session with it's secret ID
router.use(session({
  secret: 'cookie_secret',
  proxy: true,
  resave: true,
  saveUninitialized: true
}));

router.get('/', function(req, res, next){
  if(req.session.username){
    client.hgetall(req.session.username, function(err, user){
      if(err) res.render("errorPage", {});
      res.render('index', {user: user});
    });
  }
  else
    res.redirect('/login');
});


//SignUp Page
router.get('/signup', function(req, res, next) {
  res.render('signup', { title: 'Sign Up Page' });
});


//Login Page
router.get('/login', function(req, res, next) {
  res.render('login', { title: 'Login Page' });
});


//Post SignUp
router.post('/signup', function(req, res, next){
  var name = req.body.name;
  var username = req.body.username;
  var password = req.body.password;
  var algo = req.body.algo
  // var developers = 
  if(req.body.developers=="")
    var developers = 10;
  else 
    var developers = parseInt(req.body.developers);   
  if(req.body.organizations=="")
    var organizations=10;
  else
    var organizations = parseInt(req.body.organizations);
  if(req.body.employees=="")
    var employees=10;
  else
    var employees = parseInt(req.body.employees);

  client.hmset(username, [
    'name', name,
    'password', password,
    'developers', developers,
    'organizations', organizations,
    'employees', employees,
    'algo',algo
  ], function(err, user){
    if(err){
      console.log(err);
    }
    console.log("User Signed Up Successfully" ,{ user });
    res.redirect('/login');
  });
});




//Post Login
router.post('/login', function(req, res, next){
  client.hgetall(req.body.username, function(err, user){
    if(!user){
      res.render('login', {
        error: 'User does not exist'
      });
    } 
    else {
      client.hgetall(req.body.username, function(err, user){
        if(user.password==req.body.password)
        {
          req.session.username=req.body.username;
          req.session.algo = user.algo
          console.log({user})
          res.redirect('/');
        }
        else
        {
          res.render('login', {
            error: 'Wrong Credentials'
          });
        }
      });

    }
  });
});



// Developers Page
router.get('/developers',function(req, res, next){
  if(req.session.username)
{    if(req.session.algo=="Token Bucket Algorithm"){
      TokenBucket(req.session.username,'developers','developers','pagelimitexced',res,client)
    }
    else{
      SlidingWindow(req.session.username,'developers','developers','pagelimitexced',res,client)
    }
}
  else
    res.redirect('/login');
});

// Companies Page
router.get('/organizations', function(req, res, next){
  if(req.session.username)
  {    if(req.session.algo=="Token Bucket Algorithm"){
    TokenBucket(req.session.username,'organizations','organizations','pagelimitexced',res,client)
  }
  else{
    SlidingWindow(req.session.username,'organizations','organizations','pagelimitexced',res,client)
  }}
  else
    res.redirect('/login');
});

// Students Page
router.get('/employees', function(req, res, next){
  if(req.session.username)
  {    if(req.session.algo=="Token Bucket Algorithm"){
    TokenBucket(req.session.username,'employees','employees','pagelimitexced',res,client)
  }
  else{
    SlidingWindow(req.session.username,'employees','employees','pagelimitexced',res,client)
  }}  else
    res.redirect('/login');
});


module.exports = router;
