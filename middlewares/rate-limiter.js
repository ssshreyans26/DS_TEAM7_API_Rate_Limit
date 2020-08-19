const moment = require("moment");

/**
 * Token-Bucket Algorithm to limit number of requests coming from the user.
 * @param {string} username 
 * @param {string} api 
 * @param {string} errorPage 
 * @param {object} res 
 * @param {object} client
 * @returns 
 * This function returns an error page if it encounter an error or else it renders the page requested. 
 * If the rate-limit has exceeded then it renders the page limit exceeded page. 
 */
function TokenBucket(username, api, errorPage, res, client) {
  var key = username + api;
  //If Key has not get expired
  client.exists(key, function (err, reply) {
    if (reply == 1) {
      client.get(key, function (err, count) {
        if (count > 1) {
          res.render(api);
          client.decr(key, function (err, count) {
            console.log("Number of times user can access this page", { count });
          });
        } else res.render(errorPage);
      });
    } else {
      client.hgetall(username, function (err, user) {
        if (api == "developers") var access_limit = user.developers;
        else if (api == "organizations")
          var access_limit = user.organizations;
        else if (api == "employees") var access_limit = user.employees;
        //Set Rate-Limit for particular page and user
        client.set(key, access_limit);
        //Key will expire after 1 minute
        client.expire(key, 60);
        if (err) console.log(err);
        if (access_limit > 0) res.render(api);
        else res.render(errorPage);
      });
    }
  });
}

/**
 * Sliding-Window Algorithm to limit number of requests coming from the user.
 * @param {string} username 
 * @param {string} api 
 * @param {string} errorPage 
 * @param {object} res 
 * @param {object} client
 * @returns 
 * This function returns an error page if it encounter an error or else it renders the page requested. 
 * If the rate-limit has exceeded then it renders the page limit exceeded page. 
 */
function SlidingWindow(username, api, errorPage, res, client) {
  var key = username + api;
  client.exists(key, (err, reply) => {
    if (err) {
      console.log("problem with redis");
      system.exit(0);
    }

    if (reply == 1) {
      console.log("Key exists")
      client.get(key, (err, redisResponse) => {
        let data = JSON.parse(redisResponse);
        let currentTime = moment().unix();
        let lessThanMinuteAgo = moment().subtract(1, "minute").unix();
        let thresHold = 0;
        data.forEach((item) => {
          console.log(item.requestTime, lessThanMinuteAgo, item);
          if( item.requestTime > lessThanMinuteAgo){
            console.log("sdhjgfhdfs");
            thresHold += item.counter;
            
          }
        });


        console.log({thresHold});
        if (thresHold >= data[0].access_limit) {
          console.log({ error: 1, message: "throttle limit exceeded" });
          res.render(errorPage);
        } else {
          let isFound = false;
          data.forEach((element) => {
            if (element.requestTime==currentTime) {
              isFound = true;
              element.counter++;
            }
          });

          if (!isFound) {
            client.hgetall(username, function (err, user) {
              console.log({user});
              if (api == "developers") 
                var access_limit = user.developers;
              else if (api == "organizations")
                var access_limit = user.organizations;
              else if (api == "employees")
                var access_limit = user.employees;
              //Set Rate-Limit for particular page and user
              const x = {
                requestTime: currentTime,
                counter: 1,
                access_limit: access_limit,
              };
              console.log(x, data);
              data.push(x);
              client.set(key, JSON.stringify(data));
            });
          }else{

            client.set(key, JSON.stringify(data));
          }
          console.log(JSON.stringify(data, null, 4));
          res.render(api);
        }
      });
    } else {
      client.hgetall(username, function (err, user) {
        if (api == "developers") 
           var access_limit = user.developers;
        else if (api == "organizations")
          var access_limit = user.organizations;
        else if (api == "employees") 
           var access_limit = user.employees;
        let data = [];
        let requestData = {
          requestTime: moment().unix(),
          counter: 1,
          access_limit: access_limit,
        };
        data.push(requestData);
        client.set(key, JSON.stringify(data));
      });

      res.render(api);
    }
  });
}

module.exports = { TokenBucket, SlidingWindow };
