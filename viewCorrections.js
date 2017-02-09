module.exports = function () {

    // Load NPM packages.
    var fs = require('fs');
    var inquirer = require('inquirer');

    // Initialize variables that will be used across functions.
    var allCorrections;
    var currentFile;
    var correctionFile;

    // Try to import path values. Don't worry if they weren't provided, though.
    try {
        var paths = require('./paths.js');
    } catch(e) {}

    readCorrections();

    function readCorrections() {
        if (typeof(paths) !== 'undefined') {
            correctionFile = paths.corrections;
        } else {
            correctionFile = './corrections.json';
        }

        fs.readFile(correctionFile, 'utf8', function (error, data) {
            if (error) {
                return console.log(error);
            }

            allCorrections = JSON.parse(data);

            if (Object.keys(allCorrections).length > 0) {
                selectInterview();
            } else {
                console.log('No corrections found! ' +
                    '\nIf this is unexpected, please verify the value of `corrections` in `paths.js`.')
            }
        });
    }

    function selectInterview() {

        var selectInterviewQuestion = {
            name: 'interviewSelected',
            type: 'list',
            message: 'Which interview\'s corrections would you like to view?',
            choices: Object.keys(allCorrections)
        };

        inquirer.prompt(selectInterviewQuestion).then(function (answers) {
            currentFile = answers.interviewSelected;
            browseCorrections(currentFile);
        });
    }

    function browseCorrections(interviewPath) {

        var theseCorrections = allCorrections[interviewPath];
        var correctionsArray = theseCorrections.map(function (item) {
            return JSON.stringify(item)
        });

        var browseQuestion = {
            name: 'correctionChosen',
            type: 'list',
            message: '\nHere are all of the corrections associated with that file. ' +
            '\nIf you would like to delete a correction, select it now.' +
            '\nIf you don\'t have any changes to make, select "Exit" and the end of the list.\n',
            choices: correctionsArray.concat([new inquirer.Separator, 'Exit'])
        };

        inquirer.prompt(browseQuestion).then(
            function (answers) {
                if (answers.correctionChosen === 'Exit') {
                    askWhetherToStartOver();
                } else {
                    confirmDelete(answers.correctionChosen);

                }
            }
        );
    }

    function confirmDelete(currentCorrection) {
        var deleteQuestion =
            {
                name: 'confirmed',
                type: 'confirm',
                message: 'Are you sure you want to delete this correction?\n' + currentCorrection
            };

        inquirer.prompt(deleteQuestion).then(function (answers) {
            if (answers.confirmed) {
                rewriteCorrections(currentCorrection);
            } else {
                askWhetherToStartOver();
            }
        });
    }

    function rewriteCorrections(currentCorrection) {
        var corrections = allCorrections[currentFile];

        if (corrections.length === 1) {
            // If the correction we're deleting is this file's only correction, delete the key for this file altogether.
            delete allCorrections[currentFile];
        } else {
            // This file's value in allCorrections is an array of corrections.
            // Overwrite it with an array of corrections that doesn't include the one we want to remove.
            allCorrections[currentFile] = corrections.filter(function (item) {
                return JSON.stringify(item) !== currentCorrection
            });
        }

        // Write the updated allCorrections object to correctionFile.
        fs.writeFile(correctionFile, JSON.stringify(allCorrections, null, 2));

        askWhetherToStartOver();
    }

    function askWhetherToStartOver() {
        var exitQuestion = {
            name: 'continue',
            type: 'confirm',
            message: 'Would you like to continue browsing corrections?'
        };

        inquirer.prompt(exitQuestion).then(function (answers) {
            if (answers.continue) {
                // Restart script from where the interview was selected.
                readCorrections();
            } else {
                // Exit script with message.
                console.log('Thank you, goodbye!');
            }
        });
    }
};
