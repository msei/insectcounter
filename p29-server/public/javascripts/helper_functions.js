
const helpers = {

    // Test function
    add_func: function(a,b) {return a+b;},

    show_snackbar: function() {
        const x = document.getElementById("snackbar");
        if (x !== null) {
            x.className = "show";
            // After 5 seconds, remove the show class from DIV
            setTimeout(function(){
                x.className = x.className.replace("show", "");
            }, 5000);
        }
    },

    read_cookie: function(name) {
        const cookie = document.cookie.match('(^|[^;]+)\\s*' + name + '\\s*=\\s*([^;]+)');
        return cookie ? cookie.pop() : '';
    },

    locals_de: {
        datastream_desc: "Klicke auf den Link um zur Detailseite zu gelangen",
        day_scale: "Tag",
        scale: "Skala",
        month_scale: "Monat",
        next: "Nächster",
        previous: "Vorheriger",
        change_scale: "Ändere zu"

    },

    locals_en: {
        datastream_desc: "Click the link to go to a datastream page",
        day_scale: "day",
        scale: "scale",
        month_scale: "month",
        next: "Next",
        previous: "Previous",
        change_scale: "Change to"
    }

};


if(typeof exports !== 'undefined') {
    exports.helpers = helpers;
} else {
    helpers["gost_uri"] = decodeURIComponent(helpers.read_cookie("GOST-URI"));
    helpers["lang"] = helpers.read_cookie("LANG").split(".")[0];
    if (helpers.lang.startsWith("de")) {
        helpers["locals"] = helpers.locals_de;
    } else {
        helpers["locals"] = helpers.locals_en;
    }
}

