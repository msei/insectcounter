if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}
module.exports = {
	jwtSecretSensor: process.env.JWT_SECRET_SENSOR,
	jwtSecretUser: process.env.JWT_SECRET_USER,
};
