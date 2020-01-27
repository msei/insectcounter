const request = require('request-promise');
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const username = process.env.GOST_USER, password = process.env.GOST_PASSWORD,
    auth = "Basic " + new Buffer.from(username + ":" + password).toString("base64");

const create_gost =function(auth, json, path){
	return request.get(`${process.env.GOST_URI}/v1.0/${path}`)
	.then(function(res){
		if(!JSON.parse(res).value[0]){
			return request.post(`${process.env.GOST_URI}/v1.0/${path}`, {
					headers: {
						"Authorization": auth
					},
					json: json
				}, (error, res, body) => {
					if (error) {
						console.error(error);
						return false
					}
					return true;
			});
		}
		return true
	})
};

const main = function() {
    // Create Observed Property
    create_gost(auth, {
        "name": "Anzahl Insekten",
        "description": "Anzahl Insekten",
        "definition": "Anzahl Insekten"
    }, "ObservedProperties");

    // Create Sensor
    create_gost(auth, {
        "name":"Optisches Mikrofon",
        "encodingType": "application/pdf",
        "metadata": "webseite sensor oder von uns mit ml model version?.pdf",
        "description": "Der Sensor für die Aufnahme"
    }, "Sensors");

};

main();
