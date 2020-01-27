const request = require('request-promise');
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}


const addMonths = function(date, months)
{
	let month = date.getMonth() + months
	if(month < 0){
		date.setFullYear(date.getFullYear()-1)
		date.setMonth(12+month)
		return date
	}
	if(month > 11){
		date.setFullYear(date.getFullYear()+1)
		date.setMonth(month-12)
		return date
	}
	date.setMonth(month)
	return date
}

const username = process.env.GOST_USER, password = process.env.GOST_PASSWORD,
    auth = "Basic " + new Buffer.from(username + ":" + password).toString("base64");

const dict = {"0": {"name": "Ae. aegypti"}, "1": {"name": "Ae. albopictus"}, "2": {"name": "An. arabiensis"},
    "3": {"name": "An. gambiae"}, "4": {"name": "C. pipiens"}, "5": {"name": "C. quinquefasciatus"}};

const myArgs = process.argv.slice(2);

let datastream_id;

if (myArgs[0] !== undefined){
    datastream_id = myArgs[0];
} else {
    console.log("Please give datastream ID as argument");
    process.exit(1 )
}

const create_observation = function(timestamp, datastream_id, auth, result){
    console.log(timestamp, result);
    return request.post(`${process.env.GOST_URI}/v1.0/Observations`, {
        headers: {
            "Authorization": auth
        },
        json: {
            "result": result,
            "phenomenonTime": timestamp.toISOString(),
            "Datastream": {
                "@iot.id": datastream_id
            }
        }
    }, (error, res, body) => {
        if (error) {
            console.error(error);
            return false
        }
        //console.log(`statusCode: ${res.statusCode}`);
        //console.log(body);
        return true;
    });
};

const main = async function() {

	let start = new Date(); //4*6*7 days, half a year
    let end = new Date();
	start.setMonth(start.getMonth()-2)
	end.setMonth(end.getMonth()+2)
    console.log(start.toISOString());
    console.log(end);

    let d = start;
    const items = ["0", "1", "2", "3", "4", "5"];

    while(d < end){
        for (let hour = 1; hour <= 24; hour++){
            d.setHours(hour);
            for (let minute = 0; minute < 60; minute++){
                d.setMinutes(minute);
                let lows = [];
                lows.push(4 - Math.abs(12-hour)/3);
                lows.push(3 - Math.abs(8-hour)/5);
                lows.push(2 - Math.abs(20-hour)/10);
                lows.push(5 - Math.abs(15-hour));
                lows.push(2 - Math.abs(10-hour)/2);
                lows.push(3 - Math.abs(14-hour)/4);
                let high = 6;
                let rands = [];
                lows.forEach(function(low){
                    rands.push(Math.random() * (high - low) + low);
                });

                let max = Math.max(...rands);

                if (max > 5.9){
                    let index = rands.indexOf(max);
                    await create_observation(d, datastream_id, auth, dict[index]["name"]);
                }
            }
        }
    }
};

main();

