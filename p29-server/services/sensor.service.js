const request = require('request-promise');
const moment = require('moment');
const auth = require('./auth.service.js');
const db = require('../config/database.js').pool;
const gost = require('../config/gostConfig.js');
if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}

const auth_gost = "Basic " + Buffer.from(gost.username + ':' + gost.password).toString('base64');



//Forwards Data to the GOST Server, and returns a Promise
const gostPostPromise = (user, body) => {
	return new Promise(resolve => {
		if (!user || !body) {
			throw new Error("No user or body specified");
		}
		if (!user.datastreamid) {
			throw new Error("Invalid user object");
		}
		if (!body.result || !body.timestamp || !body.parameters) {
			throw new Error("Invalid body");
		}
		try {
			JSON.parse(JSON.stringify(body.parameters));
		}
		catch (err) {
			console.log(err);
			throw new Error("Parameters not JSON")
		}
		resolve();
	}).then(() => {
		let datastream = user.datastreamid;

		let options = {
			method: 'POST',
			uri: `${process.env.GOST_URI}/v1.0/Observations`,
			headers: {
				"Authorization": auth_gost
			},
			json: {
				'result': body.result,
				'phenomenonTime': body.timestamp, //Send the data in ISO Format
				'parameters': body.parameters,
				'Datastream': {
					'@iot.id': datastream
				}
			},
		};
		return request(options);
	});


};

//Sends GET Request to the GOST Server for a specific ID and returns a Promise
const gostGetPromise = (sensorID) => {
	let options = {
		method: "GET",
		uri: `${process.env.GOST_URI}/v1.0/Datastreams(${sensorID})`,
		resolveWithFullResponse: true
	};
	return request(options);
};

const gostGetThingPromise = (sensorID) => {
	let options = {
		method: "GET",
		uri: `${process.env.GOST_URI}/v1.0/Datastreams(${sensorID})/Thing`,
		resolveWithFullResponse: true
	};
	return request(options);
};

const createThing = (name, description, position, loc_name, loc_desc, long, lat) => {

	let options = {
		method: 'POST',
		uri: `${process.env.GOST_URI}/v1.0/Things`,
		headers:{
			"Authorization": auth_gost
		},
		json: {
			'name': name,
			'description': description,
			'properties': {
				'position': position
			},
			'Locations': [
				{
					'name': loc_name,
					'encodingType': 'application/vnd.geo+json',
					'description': loc_desc,
					'location': {'coordinates': [long, lat], 'type': 'Point'}
				}
			]
		}
	};
	return request(options);
};

const updateThing = (name, description, position, loc_name, loc_desc, thingID) => {

	let options = {
		method: 'PATCH',
		uri: `${process.env.GOST_URI}/v1.0/Things(${thingID})`,
		headers:{
			"Authorization": auth_gost
		},
		json: {
			'name': name,
			'description': description,
			'properties': {
				'position': position
			}
		}
	};
	return request(options);
};


const deleteThing = (thingID) => {

	let options = {
		method: 'DELETE',
		uri: `${process.env.GOST_URI}/v1.0/Things(${thingID})`,
		headers:{
			"Authorization": auth_gost
		}
	};
	return request(options);
};

const createDatastream = (thing_id) => {

	let options = {
		method: 'POST',
		uri: `${process.env.GOST_URI}/v1.0/Datastreams`,
		headers:{
			"Authorization": auth_gost
		},
		json: {
			"name": "Gezählte Insekten",
			"unitOfMeasurement": {
				"name": "Zeitpunkt",
				"symbol": "String",
				"definition": "Zeitpunkt eines Insekt"
			},
			"Thing": {
				"@iot.id": thing_id
			},
			"description": "Datastream für die gezählten Insekten (Zeitpunkt)",
			"Sensor": {
				"@iot.id": 1
			},
			"ObservedProperty": {
				"@iot.id": 1
			},
			"observationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_CountObservation"
		}
	};
	return request(options);
};

const createSensor = (name, user, position, long, lat) => {

	return checkSensorName(user.id, name).then(function(res) {

		// If not create sensor (thing) in gost (need, name, description==name?, position (e.g. Garten), location as LONG + LAT (For now, user has to enter it manually)
		return createThing(name, name, position, position, position, long, lat).then(function(result){
			const thing_id = result["@iot.id"];
			return createDatastream(thing_id).then(function(result) {
				const datastream_id = result["@iot.id"];
				const createQuery = `INSERT INTO
									  sensors(id, name, userid, position, created_date, modified_date)
									  VALUES($1, $2, $3, $4, $5, $6)
									  returning *`;
				const values = [
					datastream_id,
					name,
					user.id,
					position,
					moment(new Date()),
					moment(new Date())
				];

				//	Create sensor with that datastream id and user id
				return db.query(createQuery, values).then(function(result) {
					console.log('created');
					console.log(result.rows[0]);
					return {
						token: auth.generateToken(
							{
								userid: user.id, 
								datastreamid: datastream_id, 
								thing_id: thing_id
							}), 
						sensor_id: datastream_id, 
						thing_id: thing_id};
				});
			})

		});

	});

};

const checkSensor = (sensorID, userID) => {
	const findOneQuery = 'SELECT * FROM sensors WHERE id=$1';
	return db.query(findOneQuery, [sensorID]).then(function(result) {
		if(!result.rows[0]) {
			throw new Error("Sensor does not exist");
		}
		if(result.rows[0]["userid"] !== userID) {
			throw new Error("Not your sensor!");
		}
		return result.rows[0];
	})
};

const checkSensorName = (userID, name) => {
	const findAllQuery = 'SELECT * FROM sensors WHERE userid=$1 AND name=$2';
	return db.query(findAllQuery, [userID, name]).then(function(result) {
		if (!result.rows[0]) {
			return "Success";
		} else {
			throw new Error("Sensor with that name and user already exists")
		}
	})
};

const updateSensor =  (datastreamID, userID, name, position) => {

	const updateOneQuery =	`UPDATE sensors
							SET name=$1,position=$2,modified_date=$3
							WHERE id=$4 returning *`;
	// Also use userid such that user can only delete their own sensors
	return checkSensor(datastreamID, userID).then(function(sensor) {
		// TODO: check if the name is not the same as any other sensor of that user (except for the current sensor)
		return gostGetThingPromise(datastreamID).then(function(result) {
			const thingID = JSON.parse(result.body)["@iot.id"];
			return updateThing(name, name, position, position, position, thingID).then(function(result) {
				const values = [
					name,
					position,
					moment(new Date()),
					datastreamID
				];
				//Update sensor in our database
				return db.query(updateOneQuery, values);
			})
		});

	});

};

const deleteSensor = (datastreamID, userID) => {

	const deleteQuery = 'DELETE FROM sensors WHERE id=$1 AND userid=$2 returning *';
	return checkSensor(datastreamID, userID).then(function(result) {
			return db.query(deleteQuery, [datastreamID, userID]).then(function(result) {
				if(!result.rows[0]) {
					throw new Error("no_results")
				}
				return "Deleted";
			});
	});

};

module.exports = {
	gostPostPromise,
	gostGetPromise,
	createSensor,
	updateSensor,
	deleteSensor,
};
