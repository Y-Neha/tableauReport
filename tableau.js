var viz;
var sheet;
let yearConst = "";
var workbook;
var database;

const firebaseConfig = {
    apiKey: "AIzaSyDGZ0xAsuFtA90pLN7iqZrq6D0CHZvGed4",
    authDomain: "patient-dashboard-1e88a.firebaseapp.com",
    databaseURL: "https://patient-dashboard-1e88a.firebaseio.com",
    projectId: "patient-dashboard-1e88a",
    storageBucket: "patient-dashboard-1e88a.appspot.com",
    messagingSenderId: "390406846479",
    appId: "1:390406846479:web:7ccbe898ec2175a8c18b7a"
};

function initViz() {
    var containerDiv = document.getElementById("vizContainer"),
        url = "https://public.tableau.com/views/TableauAlexa_V2/PatientDashboard"
    options = {
        hideTabs: false,
        hideToolbar: true,
    };
    viz = new tableau.Viz(containerDiv, url, options);
    console.log("Viz", viz)
    firebase.initializeApp(firebaseConfig);
    console.log("firebase", firebase);
    database = firebase.database();
    console.log("datababse", database);
    setTimeout(refresh, 5000);
}

function yearFilter(year) {
    workbook = viz.getWorkbook();
    sheet = workbook.getActiveSheet();
    console.log("workbook", workbook);
    console.log("sheet", sheet);
    if (year === 2011 || year === 2012 || year === 2013) {
        console.log("woooo", sheet.getWorksheets());
        sheet.getWorksheets().get("P- Total Patients").applyFilterAsync("VisitYear", year, tableauSoftware.FilterUpdateType.REPLACE, {
            hideTabs: false
        });
    } else {
        console.log("woooo", sheet.getWorksheets());
        sheet.getWorksheets().get("P- Total Patients").applyFilterAsync("VisitYear", [2011, 2012, 2013], tableauSoftware.FilterUpdateType.REPLACE, {
            hideTabs: false
        });
    }
}

function refresh() {


    database.ref('/patient').child('year').on('value', function (snapshot) {
        console.log("snapshot", snapshot);
        console.log("snapshot", snapshot.val());
        const year = snapshot.val();
        if (year === "") {
            console.log("All year");
            yearFilter("");
        } else {
            console.log("Individual year");
            yearFilter(year);
        }
        getUnderlyingData()
    });
}

function getUnderlyingData() {
    console.log("getUnderlyingData");
    //  sheet = viz.getWorkbook().getActiveSheet().getWorksheets().get("P- Total Patients");

    if (sheet.getSheetType() === 'worksheet') {
        sheet.getUnderlyingDataAsync(options).then(function (t) {
            console.log("dataTarget", t.getData())
        });

        //if active sheet is a dashboard get data from a specified sheet
    } else {
        worksheetArray = viz.getWorkbook().getActiveSheet().getWorksheets();
        var totalPatients, totalVisits;
        for (var i = 0; i < worksheetArray.length; i++) {
            worksheet = worksheetArray[i];
            sheetName = worksheet.getName();
            if (sheetName == "P- Total Visits") {
                worksheetArray[i].getSummaryDataAsync(options).then(function (t) {
                    console.log("P- Total Visits data", t.getData())
                    console.log("dataTarget", t.getData()[0][1].formattedValue)
                    totalVisits = t.getData()[0][1].value
                    updateValues("totalVisits", totalVisits)
                });
                // } else if (sheetName == "P- Total Patients") {
                //     worksheetArray[i].getSummaryDataAsync(options).then(function (t) {
                //         console.log("P- Total Patients", t.getData())
                //         console.log("dataTarget", t.getData()[0][1].value)
                //         totalPatients = t.getData()[0][1].value
                //     });
            }
            // else if (sheetName == "P- Top 10 Cities having highest number of patients") {
            //     worksheetArray[i].getSummaryDataAsync(options).then(function (t) {
            //         console.log("P- Top 10 Cities having highest number of patients", t.getData())
            //     });
            // }
        }
    }
}

function updateValues(name, value) {
    database.ref('/patient').update({
        [name]: value,
    });
}