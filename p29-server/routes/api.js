const express = require('express');
const request = require('request-promise');
const router = express.Router({mergeParams: true});
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const getData = function(query, datax) {
   return request.get(query)
        .then(function(response) {
            let data = JSON.parse(response);
            data.value.map(obsv => datax.push({result: obsv.result, phenomenonTime: obsv.phenomenonTime}));
            if (data["@iot.nextLink"] !== undefined) {
                console.log(data["@iot.nextLink"]);
                return getData(data["@iot.nextLink"], datax);
            } else {
                return datax;
            }
    })
        .catch(function(err) {
            console.log(err);
            return err;
    });

};

router.get('/agg', function(req, res, next) {
    console.log(req.query);
    let datax = [];

    let sensorID = req.query.sensorID;
    let year = req.query.year;
    let month = req.query.month;
    let day = req.query.day;
    let scale;
    if (day !== undefined) {
        scale = "day";
    } else {
        scale = "month";
    }

    let base_query = `${process.env.GOST_URI}/v1.0/Datastreams(${sensorID})`;
    let query = `${base_query}/Observations?$filter=year(phenomenonTime) eq ${year} and month(phenomenonTime) eq ${month} ${scale === "day" ?
        `and day(phenomenonTime) eq ${day}` : ""}&$select=result,phenomenonTime`;

    console.log(query);

    request(base_query).then(function(response){
        getData(query, datax).then(function(response) {
            res.json(response);
        }).catch(function(err){
            req.flash("flashMessage", "Error");
            res.redirect("/");
        })
    }).catch(function(err) {
        req.flash("flashMessage", "Invalid Sensor");
        res.redirect("/");
    });

});

module.exports = router;