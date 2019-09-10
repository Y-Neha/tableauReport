var viz;
var sheet;
let yearConst = "";
var workbook;
function initViz() {
    var containerDiv = document.getElementById("vizContainer"),
        url = "https://public.tableau.com/views/TableauAlexa_V2/PatientDashboard"
    options = {
        hideTabs: false,
        hideToolbar: true,
    };
    viz = new tableau.Viz(containerDiv, url, options);
    console.log("Viz", viz)
    setTimeout(refresh, 10000);
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
    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", "https://patient-dashboard-1e88a.firebaseio.com/patient.json", true);
    xhttp.send();
    xhttp.addEventListener("readystatechange", processRequest, false);
    function processRequest(e) {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
            var response = JSON.parse(xhttp.responseText);
            console.log("Current value year", response.year);
            console.log("Const value year", yearConst);
            if (response.year !== yearConst) {
                console.log("Year not equal");
                yearConst = response.year;
                if (response.year === "") {
                    console.log("All year");
                    yearFilter("");
                } else {
                    console.log("Individual year");
                    yearFilter(response.year);
                }
            }
        }
    }
    setTimeout(refresh, 5000);
}