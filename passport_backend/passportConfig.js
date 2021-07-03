const User = require("./user");
const bcrypt = require("bcryptjs");
const LocalStrategy = require("passport-local").Strategy;

const localStr= new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
  // Match user
  User.findOne({
    email: email
  }).then(user => {
    if (!user) {
      return done(null, false, { message: 'Email is not registered' });
    }

    // Match password
    bcrypt.compare(password, user.password, async(err, isMatch) => {
      if (err) throw err;
      if (isMatch) {
        user.session= user.session+ 1;
        await user.save();
        return done(null, user);
      } else {
        return done(null, false, { message: 'Password incorrect' });
      }
    });
  });
});

module.exports = function (passport) {
  passport.use(
    localStr
  );

  passport.serializeUser((user, cb) => {
    cb(null, user.id);
  });

  
  passport.deserializeUser((id, done) => {
    User.findById(id, function(err, user) {
      done(err, user);
    });
});
};