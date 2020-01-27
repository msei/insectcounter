if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}

module.exports = {
	username: process.env.GOST_USER,
	password: process.env.GOST_PASSWORD
};
