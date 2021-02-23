const localSterategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Users = require('../Models/Users');


module.exports = function(passport) {
    passport.use(
        new localSterategy({ usernameField: 'email' }, (email, password, done) => {
            Users.findOne({ email: email })
                .then(user => {
                    if (!user) {
                        return done(null, false, { message: 'کاربر مورد نظر یافت نشد' });
                    }

                    bcrypt.compare(password, user.password, (err, isMatch) => {
                        if (err) throw err;

                        if (isMatch) {
                            return done(null, user);
                        }

                        return done(null, false, { message: 'کلمه عبور صحیح نمیباشد' });
                    })
                })
                .catch(err => console.log(err));
        })
    );

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser((id, done) => {
        Users.findById(id, (err, user) => {
            done(err, user);
        });
    });
}