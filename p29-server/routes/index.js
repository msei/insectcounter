const express = require('express');
const router = express.Router({mergeParams: true});

//Returns the Index of the website
router.get('/', function(req, res, next) {
    return res.render('index', {locals: {flashMessage: req.flash('flashMessage'), locals: req.flash('locals')}, partials: {header: 'parts/header', footer: 'parts/footer'}});
});

//Returns the about page of the website
router.get('/about', function(req, res, next) {
    return res.render('mitmachen', {locals: {locals: req.flash('locals')}, partials: {header: 'parts/header', footer: 'parts/footer'}});
});

module.exports = router;

