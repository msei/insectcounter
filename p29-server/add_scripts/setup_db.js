const { Pool } = require('pg');
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



/**
* Create a user table.
* For each user save: 
* 1. The user id
* 2. The email of the user entered to register.
* 3. The password the user entered to register.
* 4. The date when the user was created.
* 5. The last date when the user was modified.
*/
const createUserTable = () => {
  const queryText =
    `CREATE TABLE IF NOT EXISTS
      users(
        id UUID PRIMARY KEY,
        email VARCHAR(128) UNIQUE NOT NULL,
        password VARCHAR(128) NOT NULL,
        created_date TIMESTAMP,
        modified_date TIMESTAMP
      )`;

  return pool.query(queryText)
    .then((res) => {
      console.log("Success", queryText);
      return res;
    })
    .catch((err) => {
      console.log(err);
    });
};

/**
* Create a sensor table.
* For each sensor save: 
* 1. The sensor id
* 2. The name given to the sensor by the user.
* 3. The user id to which the sensor belongs.
* 4. The position where the sensor is set up.
* 5. The date when the sensor was created.
* 6. The last date when the sensor was modified.
*/
const createSensorTable = () => {
  const queryText =
    `CREATE TABLE IF NOT EXISTS
      sensors(
        id INT UNIQUE PRIMARY KEY,
		name VARCHAR(128) NOT NULL,
		userid UUID NOT NULL,
        position VARCHAR(128)  NOT NULL,
        created_date TIMESTAMP,
        modified_date TIMESTAMP
      )`;

  return pool.query(queryText)
    .then((res) => {
      console.log("Success", queryText);
      return res;
    })
    .catch((err) => {
      console.log(err);
    });
};

/**
 * Drop User Table
 */
const dropUserTable = () => {
  const queryText = 'DROP TABLE IF EXISTS users';
  return pool.query(queryText)
    .then((res) => {
      console.log("Success", queryText);
      return res;
    })
    .catch((err) => {
      console.log(err);
    });
};

const dropSensorTable = () => {
  const queryText = 'DROP TABLE IF EXISTS sensors';
  return pool.query(queryText)
    .then((res) => {
      console.log("Success", queryText);
      return res;
    })
    .catch((err) => {
      console.log(err);
    });
};

/**
 * Create All Tables
 */
const createAllTables = () => {
  return createUserTable()
      .then(createSensorTable).then(() => {
        return true;
      })
      .catch(err =>{ console.log(err);});
};
/**
 * Drop All Tables
 */
const dropAllTables = () => {
  return dropSensorTable()
      .then(dropUserTable).then(() => {
        return true;
      })
      .catch(err => { console.log(err)});


};


module.exports = {
  createUserTable,
  createSensorTable,
  createAllTables,
  dropUserTable,
  dropAllTables,
  dropSensorTable
};

require('make-runnable');
