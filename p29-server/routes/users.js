const express = require('express');
const passport = require('passport');
const router = express.Router({mergeParams: true});
const userService = require('../services/users.service.js');
const auth = require('../services/auth.service.js');
const locals = require('../locals/lang').locals;
if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}

const logged_out_locals = userService.logged_out_locals;

const logged_in_locals = userService.logged_in_locals;

const render_user_page = userService.render_user_page;


router.get('/', (req, res) => {
	passport.authenticate('user-jwt', {session: false}, (err, user, next) =>  {
		let locals;
		if (err || !user) {
			return render_user_page(logged_out_locals, res, req);
		} else {
			return render_user_page(logged_in_locals,res, req)
		}
	})(req,req.body,res);
});


/**
* Create A User
* @param {object} req 
* @param {object} res
* @returns {object} reflection object 
*/
router.post('/', (req, res) => {
    if (!req.body.email || !req.body.password) {
    	req.flash('flashMessage', locals[req.language].missing_value);
		res.status(400);
		return render_user_page(logged_out_locals, res, req);
	}
    if (!auth.isValidEmail(req.body.email)) {
		req.flash('flashMessage', locals[req.language].invalid_email);
		res.status(400);
		return render_user_page(logged_out_locals, res, req);
    }
    if (Object.prototype.toString.call(req.body.password) !== "[object String]" || req.body.password.length < 8) {
		req.flash('flashMessage', locals[req.language].password_short);
		res.status(400);
		return render_user_page(logged_out_locals, res, req);
	}
    const hashPassword = auth.hashPassword(req.body.password);


		userService.createUser(req.body.email, hashPassword)
			.then(function() {
				req.flash('flashMessage', locals[req.language].db_created);
				res.status(201);
				return render_user_page(logged_out_locals, res, req);
			})
			.catch(function(error) {
				console.log(error);
				if (error.routine === '_bt_check_unique') {
					req.flash('flashMessage', locals[req.language].user_email_exists);
					res.status(400);
					return render_user_page(logged_out_locals, res, req);
				}
				req.flash('flashMessage', error);
				res.status(400);
				return render_user_page(logged_out_locals, res, req);
			});
});

  /**
   * Login a user
   * @param {object} req: The request of a user to login. 
   * @param {object} res: The response object.
   * @returns {object} user object: The user object belonging to the user who wants to login.
   */
router.post('/login', (req, res) => {
	passport.authenticate('local', {session: false}, (err, user, next) => {
		if(err || !user){
			console.log(err);
			req.flash('flashMessage', locals[req.language].invalid_confirmation);
			res.status(401);
			return render_user_page(logged_out_locals, res, req);
		}
		req.login(user, {session: false}, (err) => {
			if (err) {
				req.flash('flashMessage', err);
				res.status(401);
				return render_user_page(logged_out_locals, res, req);
			}
			const expirationTime = 60*60;
			const token = auth.generateTemporaryToken(
				{
					"iss": process.env.WEB_URI,
					"sub": user.id
				}
			, expirationTime);
			let cookie= {
				expires: new Date(Date.now() + expirationTime * 1000),
					secure: (process.env.SECURE_TOKEN.toLowerCase() === 'true'),
					httpOnly: true,
					sameSite: "Lax",
					path: '/'
			};
			res.cookie('token', token, cookie);
			req.flash('flashMessage', locals[req.language].logged_in);
			return render_user_page(logged_in_locals, res, req);
		})
	})(req,req.body,res)
});

/**
 * Logout a user
 * @param {object} req: The request of a user to logout.
 * @param {object} res: The response object.
 * @returns
 */
router.get('/logout', passport.authenticate('user-jwt', {session: false}), (req, res) => {
	req.flash("flashMessage", "Logout");
	res.clearCookie('token');
	res.status(302);
	return render_user_page(logged_out_locals, res, req);
});
  
    /**
   * Updates a user.
   * @param {object} req: The request to update a user.
   * @param {object} res: The response object.
   * @returns {object} updated user: The updated user.
   */
router.post('/put', (req, res) => {
	passport.authenticate('user-jwt', {session: false}, (err, user, next) => {
			if (err) {
				req.flash('flashMessage', locals[req.language].invalid_confirmation);
				res.status(401);
				return render_user_page(logged_out_locals, res, req);
			}
			return passport.authenticate('local', {session: false}, (err, user, next) =>  {
				if(err || !user){
					console.log(user);
					console.log(err);
					req.flash('flashMessage', locals[req.language].invalid_confirmation);
					res.status(401);
					return render_user_page(logged_in_locals, res, req);
				}
				if (!req.body.new_email && !req.body.new_password) {
					req.flash('flashMessage', locals[req.language].missing_value);
					res.status(400);
					return render_user_page(logged_in_locals, res, req);
				}
				if (req.body.new_email && !auth.isValidEmail(req.body.new_email)) {
					req.flash('flashMessage', locals[req.language].invalid_email);
					res.status(400);
					return render_user_page(logged_in_locals, res, req);
				}
				if (req.body.new_password
					&& (Object.prototype.toString.call(req.body.new_password) !== "[object String]" || req.body.new_password.length < 8)) {
					req.flash('flashMessage', locals[req.language].password_short);
					res.status(400);
					return render_user_page(logged_out_locals, res, req);
				}

				userService.updateUser(user.id, req.body.new_email, req.body.new_password).then(function (response) {
					req.flash('flashMessage', locals[req.language].db_updated);
					return render_user_page(logged_in_locals, res, req);
				}).catch(function (error) {
					if (error.routine === '_bt_check_unique') {
						req.flash('flashMessage', locals[req.language].user_email_exists);
						res.status(400);
						return render_user_page(logged_in_locals, res, req);
					}
					console.log(error);
					req.flash('flashMessage', error);
					res.status(400);
					return render_user_page(logged_in_locals, res, req);
				})
			})(req, req.body, res)
		})(req, req.body, res)
	}
);
  
  /**
   * Delete A User
   * @param {object} req 
   * @param {object} res 
   * @returns {void} return status code 401, 400 or 200
   */
router.post('/delete', (req, res) => {
	passport.authenticate('user-jwt', {session: false}, (err, user, next) => {
		if (err) {
			req.flash('flashMessage', locals[req.language].invalid_confirmation);
			res.status(401);
			return render_user_page(logged_out_locals, res, req);
		}
		return passport.authenticate('local', {session: false}, (err, user, next) =>  {
			if(err || !user){
				console.log(user);
				console.log(err);
				req.flash('flashMessage', locals[req.language].invalid_confirmation);
				res.status(401);
				return render_user_page(logged_in_locals, res, req);
			}
			userService.deleteUser(user.id)
				.then(function() {
					req.flash('flashMessage', locals[req.language].db_deleted);
					res.status(200);
					res.clearCookie('token');
					return render_user_page(logged_out_locals, res, req);
				})
				.catch(function(error) {
					req.flash('flashMessage', error);
					res.status(400);
					return render_user_page(logged_in_locals, res, req);
				});
		})(req,req.body,res)
	})(req, req.body, res)
});

module.exports = router;

