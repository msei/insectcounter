const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('req-flash');
const logger = require('morgan');
const es6Renderer = require('express-es6-template-engine');
const bodyParser = require('body-parser');

const locals = require('./locals/lang.js').locals;

//All Routes
const usersRouter = require('./routes/users');
const sensorRouter = require('./routes/sensor');
const indexRouter = require('./routes/index');
const apiRouter = require('./routes/api');

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

//Setup Express with the proper engines
const app = express();
app.engine('html', es6Renderer);
app.set('views', 'views');
app.set('view engine', 'html');

app.use(logger('dev'));

app.use(express.urlencoded({ extended: false }));

app.use(cookieParser());

app.use(session({
    secret: 'sdjfjdsfsdfewhfgsdfkajerfjhrghjadghjrkgjAJ',
    resave: false,
    saveUninitialized: true
}));

app.use(flash({locals: ['flashMessage', 'token', 'ids', 'locals']}));

app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    if (req.header("Accept-Language")) {
        const req_lang = req.header("Accept-Language").slice(0,2);
        if (req_lang === "de") {
            req.language = "de_DE";
        } else if (req_lang === "en") {
            req.language = "en_US";
        } else {
            req.language = process.env.LANGU;
        }
    } else {
        req.language = process.env.LANGU;
    }
    res.cookie("LANG", req.language, {});
    res.cookie("GOST-URI", process.env.GOST_EXTERNAL_URI, {});
    req.flash("locals", locals[req.language]);
    next();
});

app.use(express.json());


//Add all Routes to Express
app.use('/users', usersRouter);
app.use('/sensor', sensorRouter);
app.use('/api', apiRouter);
app.use('/', indexRouter);

//Logs an error and changes status to 500. Happens everytime when a severe error occures
app.use((err, req, res, next) => {
    // log the error, for now just console.log
    if (err instanceof SyntaxError) {
        return res.status(400).send(locals[req.language].invalid_json);
    }
    console.log(err);
    return res.status(500).send(locals[req.language].something_broke)
});

//Default Action for non-existent routes
app.get('*',function (req, res) {
    req.flash('flashMessage', locals[req.language].invalid_page);
    res.redirect('/');
});

module.exports = app;
