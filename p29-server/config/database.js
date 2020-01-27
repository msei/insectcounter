const Pool = require('pg').Pool;
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: 54320,
});

module.exports = {
	pool
};
