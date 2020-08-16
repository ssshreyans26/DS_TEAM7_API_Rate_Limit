var express = require('express');
const redis = require('redis');
const session = require('express-session');
var router = express.Router();
const rateLimiter = require('../middlewares/rate-limiter.js');
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
  console.log(req.session.username)
  if(req.session.username){
    client.hgetall(req.session.username, function(err, user){
      res.render('index', {user: user});
    });
  }

  else
    res.redirect('/login');
});

router.get('/signup', function(req, res, next) {
  res.render('signup', { title: 'Sign Up Page' });
});

router.get('/login', function(req, res, next) {
  res.render('login', { title: 'Login Page' });
});

router.post('/signup', function(req, res, next){
  var name = req.body.name;
  var username = req.body.username;
  var password = req.body.password;
  if(req.body.developers=="")
    var developers = 10;
  else 
    var developers = parseInt(req.body.developers);   
  if(req.body.organizations=="")
    organizations=10;
  else
    organizations = parseInt(req.body.organizations);
  if(req.body.employees=="")
    employees=10;
  else
    employees = parseInt(req.body.employees);

  client.hmset(username, [
    'name', name,
    'password', password,
    'developers', developers,
    'organizations', organizations,
    'employees', employees
  ], function(err, user){
    if(err){
      console.log(err);
    }
    console.log("User Signed Up Successfully" ,{ user });
    res.redirect('/login');
  });
});



router.post('/login', function(req, res, next){
  console.log("Inside Login Post")


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
    rateLimiter(req.session.username,'developers','developers','pagelimitexced',res,client)
  else
    res.redirect('/login');
});

// Companies Page
router.get('/organizations', function(req, res, next){
  if(req.session.username)
    rateLimiter(req.session.username,'organizations','organizations','pagelimitexced',res,client)
  else
    res.redirect('/login');
});

// Students Page
router.get('/employees', function(req, res, next){
  if(req.session.username)
    rateLimiter(req.session.username,'employees','employees','pagelimitexced',res,client)
  else
    res.redirect('/login');
});


module.exports = router;
