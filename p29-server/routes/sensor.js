const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const router = express.Router({mergeParams: true});

const db = require('../config/database').pool;
const sensorService = require('../services/sensor.service.js');
const userService = require('../services/users.service.js');
const opts = require('../services/auth.service').opts_sensor;
const config = require('../config/jwtConfig');
const locals = require('../locals/lang.js').locals;
const logged_out_locals = userService.logged_out_locals;

const logged_in_locals = userService.logged_in_locals;

const render_user_page = userService.render_user_page;

//jwt protected http post of new data
router.post('/',  (req,res) => {
	passport.authenticate('sensor-jwt', {session: false}, (err, user, next) => {
		if(err || !user){
			return res.status(401).send(`${locals[req.language].access_denied}: ${err}`);
		}
		if(!req.body){
			return res.status(400).send(locals[req.language].invalid_body)
		}

		if(!user.datastreamid){
			return res.status(400).send(locals[req.language].invalid_user)
		}
		
		if(!req.body.result || !req.body.timestamp || !req.body.parameters){
			return res.status(400).send(locals[req.language].invalid_body)
		}

		sensorService.gostPostPromise(user, req.body)	//Handles the result of the PostPromise
			.then( function(parsedBody){
				return res.status(200).send();
			})
			.catch( function(err){
				try {
					return res.status(400).send(err.error.error);
				} catch(error){
					return res.status(400).send(err);
				}
			});
	})(req,req.body,res)
});

//Renders a view containing data with a specific ID (datastream id)
router.get('/:sensorID(\\d+)', (req, res, next) => {							
	sensorService.gostGetPromise(req.params.sensorID)	
		.then( function(fullRes) {
			if (fullRes.statusCode === 200) {
				res.render('sensor', {locals: {sensorID: req.params.sensorID, locals: req.flash('locals')}, partials: {header: 'parts/header', footer: 'parts/footer'}});
			} else { 
				req.flash("flashMessage", locals[req.language].invalid_sensor);
				res.redirect("/")
			}
		})
		.catch( function(err){
            req.flash("flashMessage", locals[req.language].invalid_sensor);
            res.redirect("/")
		});
});


//inserts a new Sensor
router.post('/internal', passport.authenticate('user-jwt', {session:false} ),(req, res)=> {
	if (!req.body.position || !req.body.name || !req.body.long || !req.body.lat) {
		req.flash('flashMessage', locals[req.language].missing_value);
		res.status(400);
		return render_user_page(logged_in_locals, res, req);
	}
	let name = req.body.name;
	let user = req.user;
	let pos = req.body.position;
	let long = parseFloat(req.body.long.replace(",","."));
	let lat = parseFloat(req.body.lat.replace(",","."));
	if(isNaN(long) || isNaN(lat)){
		req.flash('flashMessage', locals[req.language].invalid_coords);
		res.status(400);
		return render_user_page(logged_in_locals, res, req);
	}	
	sensorService.createSensor(name, user, pos, long, lat).then(function(result) {
		req.flash('ids', `Thing ID: ${result.thing_id}, Datastream ID: ${result.sensor_id}`);
		req.flash('token', `${result.token}`);
		res.status(201);
		return render_user_page(logged_in_locals, res, req);
	}).catch(function(error) {
		if (error.routine === '_bt_check_unique') {
			req.flash('flashMessage', locals[req.language].sensor_id_exists);
			res.status(400);
			return render_user_page(logged_in_locals, res, req);
		}
		req.flash('flashMessage', error.message);
		res.status(400);
		return render_user_page(logged_in_locals, res, req);
	});
});

router.post('/internal/put', passport.authenticate('user-jwt',{session:false}),(req, res) => {
	// GOST cannot update the location of the Thing, if the location changes, create a new thing :)
	sensorService.updateSensor(
			req.body.datastream_id,
			req.user.id,
			req.body.name,
			req.body.position,

		)
		.then(function(entry) {
			req.flash('flashMessage', locals[req.language].db_updated);
			return render_user_page(logged_in_locals, res, req);
		})
		.catch(function(err) {
			console.log(err.message);
			req.flash('flashMessage', err.message);
			res.status(400);
			return render_user_page(logged_in_locals, res, req);
		});
});

router.post('/internal/delete', passport.authenticate('user-jwt',{session:false}), (req,res) => {
	passport.authenticate('local', {session: false}, (err, user, next) =>  {
		if(err || !user){
			console.log(err);
			req.flash('flashMessage', locals[req.language].invalid_confirmation);
			res.status(401);
			return render_user_page(logged_in_locals, res, req);
		}
		// Sensor id not known in user-jwt
		sensorService.deleteSensor(req.body.datastream_id, req.user.id).then(function(){
			req.flash('flashMessage', locals[req.language].db_deleted);
			return render_user_page(logged_in_locals, res, req);
		}).catch(function(err) {
			console.log(err.message);
			req.flash('flashMessage', err.message);
			res.status(400);
			return render_user_page(logged_in_locals, res, req);
		});
	})(req,req.body,res)
});


module.exports = router;
