$(document).ready(function() {

    // Get sensor id from the url
    const id = window.location.pathname.split('/').slice(-1)[0];

    // Get the current data
    let currDate = new Date();

    let scale = "day";
    console.log(scale);

    // Change date by -1 if clicked on previous
    $("#prev").on("click", function() {
        currDate = helpers_sensor.changeDate(-1, scale, currDate);
        load_and_draw();
    });

    // Change date by +1 if clicked on next
    $("#next").on("click", function() {
        currDate = helpers_sensor.changeDate(1, scale, currDate);
        load_and_draw();
    });

    // Change scale to monthly or daily
    $("#changeScale").on("click", function () {
        scale = scale === "day" ? "month" : "day";
        let otherScale = scale === "day" ? "month" : "day";
        $("#changeScale").text(`${helpers.locals.change_scale} ${otherScale} ${helpers.locals.scale}`);
        let show_scale = scale === "day" ? helpers.locals.day_scale : helpers.locals.month_scale;
        $("#next").text(`${helpers.locals.next} ${show_scale}`);
        $("#prev").text(`${helpers.locals.previous} ${show_scale}`);
        load_and_draw(scale, currDate, id);
    });

    // Load and draw the data for the requested date and scale
    const load_and_draw = function() {
        // Get the data from the server
        helpers_sensor.load_data(scale, currDate, id)
            // Remove diagrams if there is no data
            .then(helpers_sensor.remove_diagrams)
            // Convert and plot the results
            .then(function(data){
                // Doughnut
                let average_results = helpers_sensor.count_results(data);
                helpers_sensor.drawDoughnut(average_results["results"], average_results["result_keys"]);
                // Line
                helpers_sensor.count_results_with_time(data, scale)
                    .then(function(data_to_plot) {
                        helpers_sensor.drawLine(data_to_plot);
                        // Prepare the csv
                        let csv = helpers_sensor.convert_to_csv(data_to_plot[0], scale);
                        // Make csv available for download
                        $("#line-download").attr("href", window.URL.createObjectURL(csv));
                        $("#line-download").attr("download", "results.csv");
                    });
            })
            .catch(function(err) {
            console.log('Failed');
            console.log(err);
            });
    };

    load_and_draw();

    helpers.show_snackbar();

});
