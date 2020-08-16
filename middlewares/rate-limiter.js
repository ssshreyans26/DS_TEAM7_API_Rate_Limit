function RateLimiter(username,pageLimit,api,errorPage,res,client) {
    var key = username+api;


    //If Key has not get expired
    client.exists(key, function(err, reply) {
      if (reply == 1) {
        client.get(key, function(err, count) {
          if(count>1)
          {
            res.render(api);
            client.decr(key, function(err, count) {
              console.log("Number of times user can access this page",{count}); 
            });
          }
          else
            res.render(errorPage);
        });
      } 
      else {
        client.hgetall(username, function(err, user){
          if(pageLimit=='developers')
            var access_limit=user.developers;
          else if(pageLimit=='organizations')
            var access_limit=user.organizations;
          else if(pageLimit=='employees')
            var access_limit=user.employees;
          //Set Rate-Limit for particular page and user
          client.set(key, access_limit);
          //Key will expire after 1 minute
          client.expire(key, 60);
          if(err)
            console.log(err);
          if(access_limit>0)
            res.render(api);
          else
            res.render(errorPage);
        });
      }
    });
  }
  
  module.exports = RateLimiter
  