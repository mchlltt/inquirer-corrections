// Load NPM packages.
var inquirer = require('inquirer');

// Require create and view scripts. They both export an anonymous function.
var createNew = require('./createCorrections');
var viewExisting = require('./viewCorrections');

// Scroll console down to a blank page.
process.stdout.write('\x1Bc');

// Question to ask on script run.
var runTypeQuestion = {
    name: 'runType',
    type: 'list',
    message: 'Would you like to create new corrections or view/delete existing corrections?',
    choices: [
        'New corrections',
        'Existing corrections'
    ]
};

// Ask the user which script they want to run.
inquirer.prompt(runTypeQuestion).then(
    function (answers) {

        // Scroll console down to a blank page.
        process.stdout.write('\x1Bc');

        // If the user selected 'New corrections',
        if (answers.runType === 'New corrections') {

            // Log a line telling them what they selected.
            console.log('Creating new corrections.\r\n');

            // Then run the createCorrections script.
            createNew();

        } else {
            // Log a line telling them what they selected.
            console.log('Viewing existing corrections.\r\n');

            // Then run the viewCorrections script.
            viewExisting();
        }
    }
);