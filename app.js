const express = require('express');
const app = express();
//const port = process.env.PORT || 3000;
const port = 3000;
const path = require('path');
const hbs = require('hbs');
const multer = require('multer');
const mongoose = require('mongoose');
const Products = require('./Models/Products');
const Users = require('./Models/Users');
const bcrypt = require('bcrypt');
const { text } = require('express');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const { ensureAuth } = require('./config/auth');


//passport config======
require('./config/passport')(passport);

//MongoDB config========
const db = require('./config/keys').mongoURI;
const { authenticate } = require('passport');
mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => { console.log('mongoDB connected'); })
    .catch(err => console.log(err));

//middlewares===========
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }))
app.use(session({
    secret: 'protected',
    resave: true,
    saveUninitialized: true
}));
app.use(flash());
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});
app.use(passport.initialize());
app.use(passport.session());
app.set(path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
//======================


//multer config============
var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
var upload = multer({ storage: storage }).single('product_img');
//=======================


//root routes=================

app.get('/', (req, res) => {
    Products.find()
        .then(products => { res.render('index', { products }); })
        .catch(err => console.log(err));

});

app.get('/shopping', (req, res) => {
    res.render('defaultPage', { msg: 'به صفحه خرید خوش آمدید' })
})

app.get('/about_us', (req, res) => {
    res.render('defaultPage', { msg: 'به صفحه درباره ی ما خوش آمدید' })
})

app.get('/latest', (req, res) => {
    res.render('defaultPage', { msg: 'به صفحه آخرین محصولات خوش آمدید' })
})

app.get('/blogs', (req, res) => {
    res.render('defaultPage', { msg: 'به صفحه وبلاگ ها خوش آمدید' })
})

app.get('/pages', (req, res) => {
    res.render('defaultPage', { msg: 'به صفحه صفحات مطالب خوش آمدید' })
})


app.get('/posts', (req, res) => {
    res.render('defaultPage', { msg: 'به صفحه مطالب خوش آمدید' })
})


app.get('/search_page', (req, res) => {
    res.render('defaultPage', { msg: 'لطفا جهت سرچ کردن به صفحه ی اصلی (خانه) و باکس مربوط به سرچ که درج شده است رجوع کنید' })
})


app.get('/profile', (req, res) => {
    res.render('defaultPage', { msg: 'به پروفایل کاربری خوش آمدید' })
})


app.get('/basket', (req, res) => {
    res.render('defaultPage', { msg: 'به سبد خرید خوش آمدید' })
})

app.post('/', (req, res) => {

    Products.find({
            $text: {
                $search: req.body.search_box
            }
        }).then(founded_items => res.render('searchResult', { founded_items: founded_items }))
        .catch(err => console.log(err));
});

//======================


//admin routes==========

//management view
app.get('/admin', ensureAuth, (req, res) => {
    Products.find()
        .then(products => { res.render('admin', { products }); })
        .catch(err => console.log(err));
});

//search
app.post('/admin', ensureAuth, (req, res) => {

    Products.find({
            $text: {
                $search: req.body.search_box
            }
        }).then(founded_items => res.render('adminResult', { founded_items: founded_items }))
        .catch(err => console.log(err));
})

//add
app.get('/admin/add', ensureAuth, (req, res) => {
    res.render('add');
})

app.post('/admin/add', ensureAuth, function(req, res) {
    upload(req, res, function(err) {
        if (err instanceof multer.MulterError || err) {
            res.send('متاسفانه در ارسال تصویر خطایی رخ داده است');
        }

        let category = req.body.showing_part;

        var new_product = {
            title: req.body.new_product_title,
            price: req.body.new_product_price,
            description: req.body.new_product_description,
        }

        if (category == 'new') {
            new_product.new = true;
        }

        if (category == 'popular') {
            new_product.popular = true;
        }

        if (req.file) {
            let pic_url = req.file.path.replace('public\\', '');
            let pic_url_dir = pic_url.replace('\\', '/');
            new_product.img_url = pic_url_dir;
        } else {
            new_product.img_url = 'assets/img/default.png';
        }

        Products.insertMany(new_product)
            .then(() => { res.redirect('/admin'); })
            .catch(err => console.log(err));


    });
});

//edit
app.get('/admin/edit/:id', ensureAuth, (req, res) => {
    Products.findOne({ _id: req.params.id })
        .then(product => res.render('single', { product: product }))
        .catch(err => console.log(err));
})

app.post('/admin/edit/:id', ensureAuth, (req, res) => {
    upload(req, res, function(err) {
        if (err instanceof multer.MulterError || err) {
            res.send('متاسفانه در ارسال تصویر خطایی رخ داده است');
        }
        var product = {};
        product.title = req.body.edit_product_title;
        product.price = req.body.edit_product_price;

        if (req.body.showing_part == 'popular') {
            product.popular = true;
            product.new = false;
        }

        if (req.body.showing_part == 'new') {
            product.new = true;
            product.popular = false;
        }

        if (req.file) {
            let pic_url = req.file.path.replace('public\\', '');
            let pic_url_dir = pic_url.replace('\\', '/');
            product.img_url = pic_url_dir;
        } else {
            product.img_url = req.body.pic_temp_url
        }

        Products.updateOne({ _id: req.params.id }, product)
            .then(() => { res.redirect('/admin') })
            .catch(err => console.log(err));
    });
});

//delete
app.get('/admin/delete/:id', ensureAuth, (req, res) => {
    Products.deleteOne({ _id: req.params.id })
        .then(() => { res.redirect('/admin') })
        .catch(err => console.log(err));
});

//======================


//user routes===========
app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', (req, res) => {

    let { name, email, password, password_confrim } = req.body;
    let errs = [];

    if (!name || !email || !password || !password_confrim) {
        errs.push('پر کردن تمام فیلد ها الزامی است')
    }

    if (password != password_confrim) {
        errs.push('پسورد های وارد شده با یکدیگر مغایرت دارند')
    }

    if (password.length < 6) {
        errs.push('طول پسورد میبایست حداقل شش کاراکتر باشد')
    }

    if (errs.length > 0) {
        res.render('register', { errs, name, email, password, password_confrim });
    } else {
        Users.findOne({ email: email })
            .then(user => {
                if (user) {
                    errs.push('ایمیل وارد شده قبلا ثبت شده است')
                    res.render('register', { errs, name, email, password, password_confrim });
                } else {

                    let new_user = new Users({ name, email, password });

                    bcrypt.genSalt(10, (err, salt) => {
                        if (err) throw err;
                        bcrypt.hash(new_user.password, salt, (err, hash) => {
                            if (err) throw err;
                            new_user.password = hash;
                            new_user.save()
                                .then(() => {
                                    req.flash('success_msg', 'ثبت نام شما با موفقیت انجام شد');
                                    res.redirect('login');
                                })
                                .catch(err => console.log(err));
                        })
                    })
                }
            })
            .catch(err => console.log(err));
    }
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/admin',
        failureRedirect: '/login',
        failureFlash: true
    })(req, res, next);
});

app.get('/logout', (req, res) => {
    req.logout();
    req.flash('success_msg', 'شما از حساب کاربری خود خارج شدید');
    res.redirect('login');
});
//======================

app.listen(port, () => {
    console.log(`Example app listening at http: //localhost:${port}`)
})