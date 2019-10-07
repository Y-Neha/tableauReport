
'use strict';

const functions = require('firebase-functions');
const { WebhookClient } = require('dialogflow-fulfillment');
const { Card, Suggestion } = require('dialogflow-fulfillment');
const admin = require('firebase-admin');

var dbusername;

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: 'ws://testai-dbeeup.firebaseio.com/',
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

    // function getWorkbooks(agent) {
    //     var workbooksArray = [];
    //     console.log("entered getworkbooks");
    //     return admin.database().ref('workbooks').once('value', function (snapshot) {
    //         console.log("Workbooks", snapshot.val());
    //         workbooks = snapshot.val();
    //         console.log("workbookss", workbooks);
    //         workbooks.forEach((item) => { workbooksArray.push(item.name); });
    //         agent.add(`Workbooks under your site are ` + workbooksArray);
    //     });
    // }

    function getUserName(voiceUsername) {
        return new Promise((resolve, reject) => {
            admin.database().ref('username').once('value', function (snapshot) {
                console.log("Usernmae", snapshot.val());
                dbusername = snapshot.val();
                console.log('voice usernmae', voiceUsername);
                console.log('db username', dbusername);
                if (voiceUsername !== dbusername) {
                    console.log('Please provide authorized user');
                    reject(new Error('Please provide authorized user'));
                } else {
                    console.log('Authorized user');
                    console.log('getSites');
                    admin.database().ref('sites').once('value', function (snapshot) {
                        console.log("Sites", snapshot.val());
                        var sites = snapshot.val();
                        resolve(sites);
                    });
                }
            });
        });
    }

    function getWorkbooks() {
        return new Promise((resolve, reject) => {
            admin.database().ref('workbooks').once('value', function (snapshot) {
                var workbooks = snapshot.val();
                console.log("workbooks", snapshot.val());
                console.log("number of workbooks", workbooks.length);
                if (workbooks !== null && workbooks.length > 0) {
                    resolve(workbooks);
                } else {
                    reject(new Error('empty workbooks'));
                }
            });
        });
    }

    function getCount() {
        return new Promise((resolve, reject) => {
            admin.database().ref('number').once('value', function (snapshot) {
                console.log("Count", snapshot.val());
                var count = parseInt(snapshot.val());
                if (count > 0) {
                    resolve(count);
                } else {
                    reject(new Error('No patient visit'));
                }
            });
        });
    }


    function getUserResponse(agent) {
        const voiceUsername = agent.parameters.username;
        var siteArray = [];
        return getUserName(voiceUsername).then((result) => {
            console.log("ResultsAAA", result);
            result.forEach((item) => { siteArray.push(item.name); });
            console.log("sites array", siteArray);
            agent.add(`You are authorized user with multiple sites ` + siteArray);
        }).catch(() => {
            agent.add(`Please provide authorized user`);
        });
    }

    function ProvideSiteName(agent) {
        const voiceSitename = agent.parameters.sitename;
        const context = agent.getContext('waiting_username');
        const username = context.parameters.username;
        console.log("Context username", username);
        console.log("Context Site", context);
        console.log("voice sitename", voiceSitename);
        var workbooksArray = [];
        return getWorkbooks().then((result) => {
            console.log("Workbooksssss", result);
            result.forEach((item) => { workbooksArray.push(item.name); });
            console.log("workbooksArray", workbooksArray);
            agent.add(username + `, Workbooks under your site are ` + workbooksArray);
        }).catch((err) => {
            console.log("workbook error", err);
            agent.add(`No workbooksss`);
        });
    }

    function ProvideWorkbookName(agent) {
        const workbook = agent.parameters.workbook;
        const context = agent.getContext('waiting_workbook_name');
        const site = context.parameters.sitename;

        const context1 = agent.getContext('waiting_username');
        const username = context1.parameters.username;

        console.log("Provide Workbook Name", workbook);
        return getCount().then((result) => {
            console.log("visit count", result);
            agent.add(username + `, ` + result + ` patients under ` + workbook + ` of ` + site);
        }).catch((err) => {
            console.log("count error", err);
            agent.add(`No patient visit`);
        });
    }

    let intentMap = new Map();
    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('Default Fallback Intent', fallback);
    intentMap.set('ProvidesUserName', getUserResponse);
    intentMap.set('ProvideSiteName', ProvideSiteName);
    intentMap.set('ProvideWorkbookName', ProvideWorkbookName);
    agent.handleRequest(intentMap);
});
