const moment = require('moment');
const uuidv4 = require('uuid/v4');
const auth = require('./auth.service.js');
const db =  require('../config/database.js').pool;

const logged_out_locals = {
	logout_v: false,
	login_v: true,
	create_user_v: true,
	create_sensor_v: false,
	update_sensor_v: false,
	delete_sensor_v: false,
	update_user_v: false,
	delete_user_v: false,
};

const logged_in_locals = {
	logout_v: true,
	login_v: false,
	create_user_v: false,
	create_sensor_v: true,
	update_sensor_v: true,
	delete_sensor_v: true,
	update_user_v: true,
	delete_user_v: true
};

const render_user_page = function(locals, res, req) {
	locals["flashMessage"] = req.flash('flashMessage');
	locals["token"] = req.flash('token');
	locals["ids"] = req.flash('ids');
	locals["locals"] = req.flash('locals');
	return res.render('user', {locals:
		locals,
		partials:
			{
				header: 'parts/header',
				footer: 'parts/footer',
				logout: 'parts/logout',
				login: 'parts/login',
				create_user: 'parts/create_user',
				create_sensor: 'parts/create_sensor',
				update_sensor: 'parts/update_sensor',
				delete_sensor: 'parts/delete_sensor',
				update_user: 'parts/update_user',
				delete_user: 'parts/delete_user'
			}});
};

const createUser = (email, pwHash) => {
	const createQuery = `INSERT INTO
		users(id, email, password, created_date, modified_date)
		VALUES($1, $2, $3, $4, $5)
		returning *`;
    const values = [
		uuidv4(),
		email,
		pwHash,
		moment(new Date()),
		moment(new Date())
    ];
	
	 return db.query(createQuery, values);
};

const updateUser = async (userID, email, password) => {
	const findOneQuery = 'SELECT * FROM users WHERE id=$1';
    const updateOneQuery =`UPDATE users
		SET email=$1,password=$2,modified_date=$3
		WHERE id=$4 returning *`;
	const updateWithoutNewEmail = `UPDATE users
		SET password=$1,modified_date=$2
		WHERE id=$3 returning *`;
	let update;
	let values;
	return db.query(findOneQuery, [userID]).then(function(result) {
		if(!result.rows[0]){
			throw new Error("not_found");
		}
		let hashPassword;
		try {
			hashPassword = auth.hashPassword(password);
		} catch(err) {
			hashPassword = result.rows[0].password
		}
		if (email === result.rows[0].email || !email){
			values = [hashPassword, moment(new Date()), userID]
			update = updateWithoutNewEmail;
		} else {
			values = [
				email || result.rows[0].email,
				hashPassword,
				moment(new Date()),
				userID
			];
			update = updateOneQuery;
		}
		return db.query(update, values).then(function(result){
			return result.rows[0];
		});
	});


};

const deleteUser = async (userID) => {	
    const deleteQuery = 'DELETE FROM users WHERE id=$1 returning *';
    return db.query(deleteQuery, [userID]).then(function(result){
		if(!result.rows[0]){
			throw new Error("not_found");
		}
	});

};


module.exports={
	createUser,
	updateUser,
	deleteUser,
	logged_in_locals,
	logged_out_locals,
	render_user_page
};
