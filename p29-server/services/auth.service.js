const passport = require('passport');
const request = require('request-promise');
const db = require('../config/database').pool;
const config = require('../config/jwtConfig');
const JWTStrategy = require('passport-jwt').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}

const cookieExtractor = function(req) {
	let token = null;
	if (req && req.cookies) {
		token = req.cookies.token;
	}
	return token;
};

//Define options for the JWTStrategy
const opts_sensor = {
	jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken() ,
	secretOrKey: config.jwtSecretSensor,
};

const opts_user = {
	jwtFromRequest: cookieExtractor,
	secretOrKey: config.jwtSecretUser,
};


passport.use(new LocalStrategy(
	{
		usernameField: 'email',
		passwordField: 'password'
	},
	(email, password, done) => {
	const text = 'SELECT * FROM users WHERE email = $1';
	db.query(text, [email]).then(function(result) {
		if(!result.rows[0]){
			return done("User does not exist", false);
		}
		comparePassword(result.rows[0].password, password).then(function(res) {
			if (res) {
				return done(null, result.rows[0]);
			} else {
				return done("Incorrect password", false);
			}
		})
	}).catch(function (err) {
		return done("Something went wrong with the Database", false)
	});


}));

//Enables the JWTStrategy, and implements a way to check if a token is valid
passport.use('user-jwt',new JWTStrategy(opts_user,
	(jwtPayload, done) => {
		const text = 'SELECT * FROM users WHERE id = $1';
		db.query(text, [jwtPayload.sub]).then(function(response) {
			if(!response.rows[0]){
				console.log("ah");
				return done("User does not exist", false);
			}
			return done(null, response.rows[0]);
		}).catch(function (err) {
			return done("Something went wrong with the Database", false)
		})
	}
));

//Enables the JWTStrategy, and implements a way to check if a token is valid
passport.use('sensor-jwt', new JWTStrategy(opts_sensor,
	(jwtPayload, done) => {
		const user_query = 'SELECT id FROM users WHERE id = $1';
		const sensor_query = 'SELECT id FROM sensors WHERE userid=$1';
		const options = {
			method: "GET",
			uri: `${process.env.GOST_URI}/v1.0/Datastreams(${jwtPayload.datastreamid})`,
			resolveWithFullResponse: true
		};
		
		return db.query(user_query, [jwtPayload.userid])
			.then(function(response) {
				if(!response.rows[0]){
					return done("User does not exist", false);
				}
				const user_id = response.rows[0].id;
				const sensor_query = 'SELECT id FROM sensors WHERE userid=$1';
				return db.query(sensor_query, [user_id]).then(async function(response) {
					for (const row of response.rows) {
							if (row.id === jwtPayload.datastreamid) {
								return request(options)
									.then(function(res){
										if(res.statusCode !== 200){
											return done("Sensor does not exist", false)
										}
										console.log("ok");
										return done(null, jwtPayload);
									})
									.catch(function(err){
										return done("Something went wrong with the stream", false)
									})
							}
						}
					return done("Sensor does not exist", false);
			})})
			.catch(function(err){
				return done("Something went wrong with the user", false)
			})
	}
));

/**
* This method hashes the password a user enters while registering.
* @param {string} password: The password the user entered.
* @returns {string} returns hashed password: The password of the user hashed with bcrypt.
*/
const hashPassword = (password) => {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8))
};

/**
* This method compares the password a user enters while trying to log in with the password saved in our database for that specific user.
* @param {string} hashPassword : The hashed password saved in our database for a user.
* @param {string} password: The password entered by a user during login.
* @returns {Boolean} return True or False: Whether or not the password is equal to the one in the database.
*/
const comparePassword = (hashPassword, password) => {
    return bcrypt.compare(password, hashPassword);
};

/**
* This method evaluates whether the email entered by a user is a valid email address using regex.
* @param {string} email: Email entered by the user during login or registering.
* @returns {Boolean} True or False
*/
const isValidEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
};

/**
* This method generates a unique token for a user during the process of registering. This token is later used to identify the user.
* @param {JSON} payload: The token payload.
* @param {number} time: The timeframe
* @returns {string} token: The unique token generated for a user.
*/
const generateTemporaryToken = (payload, time) => {
    return jwt.sign(payload, opts_user.secretOrKey, { expiresIn: time });
};

const generateToken = (payload) => {
	return jwt.sign(payload, opts_sensor.secretOrKey);
};

module.exports = {
	opts_sensor,
	hashPassword,
	comparePassword,
	isValidEmail,
	generateTemporaryToken,
	generateToken,
};
