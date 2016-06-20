'use strict'

let configAuth = require('./auth');
let FacebookStrategy = require('passport-facebook').Strategy;
let pg = require('pg');
let conString = require('../../APIKEYS').PG_CONNECTION_STRING;
let client = new pg.Client(conString);

module.exports = function(passport) {
 passport.serializeUser(function(user, done) {
   done(null, user.id;)
 });
 passport.deserializerUser(function(id, done) {
   // User.findById(id, function(err, user){
   //     done(err, user);
   // });
   client.connect(function(err) {
     if (err) {
       return console.error('could not connect to postgres', err);
     }
     client.query('SELECT * FROM users WHERE fb_id =' + id, function(err, result) {
       if (err) {
         return console.error('error running query', err);
       }
       client.end();
       console.log(result + 'line 26 result passport.js')
       done(err, result[0])
     });
   });
 });
 passport.use(new FacebookStrategy({
     clientId: configAuth.facebookAuth.clientId,
     clientSecret: configAuth.facebookAuth.clientSecret,
     callbackURL: configAuth.facebookAuth.callbackURL
   },

   function(token, refreshToken, profile, done) {

     // asynchronous
     process.nextTick(function() {

       // find the user in the database based on their facebook id
       User.findOne({
         'facebook.id': profile.id
       }, function(err, user) {

         // if there is an error, stop everything and return that
         // ie an error connecting to the database
         if (err)
           return done(err);

         // if the user is found, then log them in
         if (user) {
           return done(null, user); // user found, return that user
         } else {
           // if there is no user found with that facebook id, create them
           var newUser = new User();

           // set all of the facebook information in our user model
           newUser.facebook.id = profile.id; // set the users facebook id                   
           newUser.facebook.token = token; // we will save the token that facebook provides to the user                    
           newUser.facebook.name = profile.name.givenName + ' ' + profile.name.familyName; // look at the passport user profile to see how names are returned
           newUser.facebook.email = profile.emails[0].value; // facebook can return multiple emails so we'll take the first

           // save our user to the database
           newUser.save(function(err) {
             if (err)
               throw err;

             // if successful, return the new user
             return done(null, newUser);
           });
         }

       });
     });

   }));

};