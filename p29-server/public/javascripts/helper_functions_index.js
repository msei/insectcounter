const helpers_index = {

    // Test function
    add_func: function(a,b) {return a+b;},

    // Get the Locations from the SensorThings server
    get_locations: function() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: `${helpers.gost_uri}/v1.0/Locations`,
                method: 'GET',
                success: function (data) {
                    resolve(data);
                },
                error: function (error) {
                    console.log(this.url);
                    reject(error);
                },
            })
        });
    },

    // Get the Datastreams for one location from the SensorThings server
    get_datastreams: function(location_id) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: `${helpers.gost_uri}/v1.0/Locations(${location_id})/Things`,
                method: 'GET',
                success: function (data) {
                    let datastreams_url = data.value[0]["Datastreams@iot.navigationLink"];
                    $.ajax({
                        url: datastreams_url,
                        method: 'GET',
                        success: function (data) {
                            let datastream_ids = data.value.map(x => x["@iot.id"]);
                            resolve(datastream_ids.reverse());
                        },
                        error: function(error) {
                            console.log(this.url);
                            reject(error);
                        }
                    });
                },
                error: function(error) {
                    console.log(this.url);
                    reject(error);
                }
            });
        });
    },

    // Transform data to geoJson
    transform_json_locations_to_geoJson: function(data) {
            return  Promise.all(data.value.map(async function(location) {
                return {
                    type: 'Feature',
                    geometry: location.location,
                    properties: {
                        sensorIDs: await helpers_index.get_datastreams(location["@iot.id"])
                    }
                };
            }));
    },

    // Create a GeoJSON layer
    create_geojson_layer: function(geoJsonFeatures) {
        return L.geoJSON(geoJsonFeatures, {onEachFeature: function(feature, layer) {
                popupOptions = {maxWidth: 200};
                layer.bindPopup(`${feature.properties.sensorIDs.map(id => `<b>Datastream:</b> <a href="/sensor/${id}">${id}</a> <br>`).join('')} ${helpers.locals.datastream_desc}`
                    ,popupOptions);
            }});
    }
};


if(typeof module !== 'undefined') {
    exports.helpers_index = helpers_index;
    if (typeof global !== 'undefined' && typeof global.process !== 'undefined' &&
        Object.prototype.toString.call(global.process) === '[object process]') {
        const domino = require('domino');
        const window = domino.createWindow('<html></html>');

        const document = window.document;
        var $ = require('jquery')(window); // Has to be var/global to work
        const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
        $.support.cors = true; // cross domain, Cross-origin resource sharing
        $.ajaxSettings.xhr = function() {
            return new XMLHttpRequest();
        };
    }
}