// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';

const functions = require('firebase-functions');
const { WebhookClient } = require('dialogflow-fulfillment');
const { Card, Suggestion } = require('dialogflow-fulfillment');
const admin = require('firebase-admin');
const https = require('https');


admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: 'ws://patient-dashboard-1e88a.firebaseio.com/',
});

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
    const agent = new WebhookClient({ request, response });
    console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
    console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

    function welcome(agent) {
        agent.add(`Welcome to my agent!`);
    }

    function fallback(agent) {
        agent.add(`I didn't understand`);
        agent.add(`I'm sorry, can you try again?`);
    }

    function ShowYear(agent) {
        const year = agent.parameters.year;
        console.log("voice year", year);
        return getTotalVisits("year", year).then((result) => {
            console.log("ResultsAAA", result);
            agent.add(`Visit count for year ` + year + ` is ` + result);
        }).catch((e) => {
            console.log("ERR" + e);
            agent.add(`Details of year ` + year + `will display in browser`);
        });




    }

    function showAllYear() {
        agent.add(`Showing details of all years`);
        saveReportToDb("year", "");
    }

    function saveReportToDb(label, value) {
        console.log("label", label);
        console.log("value", value);

        return admin.database().ref('patient').transaction((report) => {
            if (report !== null) {
                report[label] = value;
            }
            return report;
        }, function (error, isSuccess) {
            if (isSuccess) {
                console.log('Tableau reports based on year success: ' + isSuccess);
            } else {
                console.log('Tableau reports based on year error: ' + error);
            }
        });
    }

    function getTableauReport() {
        const url = "https://public.tableau.com/profile/api/omkar.joshi/workbooks?count=100&index=0";
    }

    function fetchTableauData() {
        console.log("Entered fetchTableauData method");
        https.get(`https://public.tableau.com/profile/api/omkar.joshi/workbooks?count=100&index=0`, (resp) => {
            let data = '';
            console.log("RESPONSE: ", resp);
            resp.on('data', (chunk) => { data += chunk; });
            resp.on('end', () => { console.log("fetchTableauData data:", data); });
        }).on("error", (err) => {
            console.log("fetchTableauData Error: " + err.message);
        });
        console.log("Exited fetchTableauData method");
    }

    function getTotalVisits(label, value) {

        return new Promise((resolve, reject) => {
            console.log("label", label);
            console.log("value", value);
            admin.database().ref('/patient').update({ year: value });
            setTimeout(admin.database().ref('/patient').child('totalVisits').on('value', function (snapshot) {
                console.log("Total Visits", snapshot.val());
                var totalVisit = snapshot.val();
                resolve(totalVisit);
            }), 20000);
        });

    }


    let intentMap = new Map();
    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('Default Fallback Intent', fallback);
    intentMap.set('Show Year', ShowYear);
    intentMap.set('Show All Years', showAllYear);
    agent.handleRequest(intentMap);
});
