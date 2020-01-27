// "Global variables to check if chart is already existent"
let myDoughnutChart;
let myLineChart;

// Global plot options (e.g. colors)
let options = {};
const backgroundcolors= {
    0: 'rgba(255, 99, 132, 0.2)',
    1: 'rgba(54, 162, 235, 0.2)',
    2: 'rgba(255, 206, 86, 0.2)',
    3: 'rgba(75, 192, 192, 0.2)',
    4: 'rgba(153, 102, 255, 0.2)',
    5: 'rgba(255, 159, 64, 0.2)'
};

const helpers_sensor = {

    // Load the data for the requested date, scale and datastream id from the server
    load_data: function(scale, date, id) {
        console.log(scale);
        const month = date.getMonth();
        const day = date.getDate();
        const year = date.getFullYear();
        $("#explanation").text(`Getting data for ${scale === helpers.locals.day_scale? `${day}.`: ""}${month+1}.${year}`);
        const url = `/api/agg?sensorID=${id}&year=${year}&month=${month+1}${scale === "day"? `&day=${day}`: ""}`;
        return new Promise((resolve, reject) => {
            $.ajax({
                url: url,
                method: 'GET',
                success: function (data) {
                    resolve(data)
                },
                error: function (err) {
                    console.log(this.url);
                    reject(err);
                }
            });
        })
    },

    // Change the date by the requested amount (determined by amount and scale)
    changeDate:  function(amount, scale, currDate) {
        console.log(scale);
        if (scale === helpers.locals.day_scale) {
            currDate.setDate(currDate.getDate() + amount);
        } else if (scale === helpers.locals.month_scale) {
            currDate.setMonth(currDate.getMonth() + amount);
        } else {
            console.log("Invalid scale");
        }
        return currDate;
    },

    // Remove the diagrams if there is no data
    remove_diagrams: function(data) {
        return new Promise(((resolve, reject) => {
            if (data.length === 0) {
                if (myDoughnutChart) {
                    myDoughnutChart.destroy();
                    myDoughnutChart = null;
                }
                if (myLineChart) {
                    myLineChart.destroy();
                    myLineChart = null;
                }
                reject('No data');
            } else {
                resolve(data);
            }
        }));
    },

    // Count all the occurrences for every species (distinct result)
    count_results: function (data) {
        const result = _(data).countBy('result')
            .map((count, result) => ({ result, count }))
            .value();
        return {"results": _.map(result, "count"), "result_keys": _.map(result, "result")};
    },

    // Count all the occurrences for every species in a time window
    // Every hour (0-1, 1-2, ...) if scale is day and every day (1,2,...) if scale is month
    count_results_with_time: function(datax, scale) {
        return new Promise(((resolve, reject) => {
            let date = new Date(datax[0]["phenomenonTime"]);
            let groupedData = _.groupBy(datax, "result");
            let data_for_plot = [];
            let col_ind = 0;
            // Get the maximum day of the requested month if scale is month
            const max = scale === helpers.locals.day_scale? 24: new Date(date.getFullYear(), date.getMonth(), 0).getDate()+1;
            const min = scale === helpers.locals.day_scale? 0: 1;

            // Count the occurrences for all the species
            for (let k in groupedData){
                // Get all occurrences for a specie by hour or day
                let counted_data = _.countBy(groupedData[k], function(x) {
                    if(scale === helpers.locals.day_scale) {
                        return new Date(x.phenomenonTime).getHours();
                    } else if (scale === helpers.locals.month_scale) {
                        return new Date(x.phenomenonTime).getDate();
                    } else {
                        reject("Invalid scale");
                    }
                });
                let count_x_y_data = _.map(counted_data, (count, measure) => ({x: count, y: measure}));
                // Add 0 for all hours, days without an occurrence
                for(let i=min; i<max; i++){
                    if (_.filter(count_x_y_data, {y: `${i}`}).length === 0){
                        // count_x_y_data[i] = 0;
                        count_x_y_data.push({x: 0, y: `${i}`});
                    }
                }
                count_x_y_data = _.sortBy(count_x_y_data, (el) => parseInt(el.y,10));
                data_for_plot.push({label: k, data: _.map(count_x_y_data, "x"), backgroundColor: backgroundcolors[col_ind]
                });
                col_ind++;
            }
            resolve([data_for_plot, min, max]);
        }));

    },

    // Convert the data to a csv blob
    convert_to_csv: function(data_for_plot, scale) {
        let csvOutput = scale === helpers.locals.day_scale ? '"Hour",' : '"Day",';
        let offset = scale === helpers.locals.day_scale? 0: 1;
        let raw_data = [];
        for (let key in data_for_plot) {
            if (data_for_plot.hasOwnProperty(key)) {
                csvOutput += '"' + String(data_for_plot[key].label) + '",';
                raw_data.push(data_for_plot[key].data);
            }
        }
        csvOutput += "\n";

        for (let i=0; i < raw_data[0].length; i++) {
            csvOutput += '"' + String(i+offset) + '",';
            for (let k in raw_data){
                if (raw_data.hasOwnProperty(k)) {
                    csvOutput += '"' + String(raw_data[k][i]) + '",';
                }
            }
            csvOutput += "\n";
        }

        return new Blob([csvOutput], {
            type: "text/csv"
        });
    },

    // Draw a line chart
    drawLine: function([data_for_plot, min, max]) {
        if (myLineChart) {
            myLineChart.data.datasets = data_for_plot;
            myLineChart.data.labels = _.range(min, max);
            myLineChart.update();
        }
        else {
            let ctx2 = $("#chart2");
            ctx2.html("");
            myLineChart = new Chart(ctx2, {
                type: 'line',
                data: {
                    labels: _.range(min, max),
                    datasets: data_for_plot
                },
                options: options
            });
        }
    },

    // Draw a doughnut chart
    drawDoughnut: function(results, result_keys){
        if (myDoughnutChart) {
            console.log("Results updated doughnut chart:", results);
            myDoughnutChart.data.datasets[0].data = results;
            myDoughnutChart.data.labels = result_keys;
            myDoughnutChart.update();
        }
        else {
            let ctx = $("#chart");
            myDoughnutChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: result_keys,
                    datasets: [{
                        label: "Counted insects",
                        data: results,
                        backgroundColor: Object.values(backgroundcolors),
                    }]
                },
                options: options
            });
        }
    }


};


if(typeof module !== 'undefined' && module.exports) {
    module.exports.helpers_sensor = helpers_sensor;
    if (typeof global !== 'undefined' && typeof global.process !== 'undefined' &&
        Object.prototype.toString.call(global.process) === '[object process]') {
        const domino = require('domino');
        const window = domino.createWindow('<html></html>');

        const document = window.document;
        var $ = require('jquery')(window); // Has to be var/global to work
        var _ = require('lodash'); // Has to be var/global to work
        const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
        $.support.cors = true; // cross domain, Cross-origin resource sharing
        $.ajaxSettings.xhr = function() {
            return new XMLHttpRequest();
        };

    }
}