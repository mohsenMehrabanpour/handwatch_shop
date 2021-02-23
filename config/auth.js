module.exports = {
    ensureAuth: function(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        req.flash('error', 'لطفا ایتدا وارد حساب کاربری خود شوید');
        res.redirect('login');
    }
}