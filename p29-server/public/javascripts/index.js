$(document).ready(function()    {
    const mymap = L.map('mapid', { zoomControl: false }).setView([49.2, 7], 10);

    // add the OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(mymap);

    // Get the Locations from the SensorThings server
    helpers_index.get_locations()
        // Transform the locations to geojson
        .then(helpers_index.transform_json_locations_to_geoJson)
        // Transform the geojson to a GeoJSON layer
        .then(helpers_index.create_geojson_layer)
        // Add to the map and fit zooms
        .then(function(geoJsonLayerGroup) {
                geoJsonLayerGroup.addTo(mymap);
                // Zoom in the map so that it fits the Locations
                mymap.fitBounds(geoJsonLayerGroup.getBounds(), {padding: [200, 200]});
        })
        .catch(function(error) {
            console.log('Failed');
            console.log(error);
        });

    helpers.show_snackbar();

});
