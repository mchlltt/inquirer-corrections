// TODO: Add way to browse and remove existing corrections.
// Load NPM packages.
var fs = require('fs');
var inquirer = require('inquirer');

// Import constant values.
var cons = require('./constants.js');
try {
    var paths = require('./paths.js');
} catch(e) {}

// Initialize filename and data variables in global scope.
var currentFileName;
var currentData;
var currentNodeIDs;
var currentEdgeIDs;
var objectID;
var currentCorrectionType;

getIdentifyingData();

function getIdentifyingData() {
    currentFileName = '';
    currentData = {};
    currentEdgeIDs = [];
    currentNodeIDs = [];

    inquirer.prompt(cons.fileIdentifyingQuestions).then(findFiles);
}

function findFiles(answers) {
    var idPattern;
    var visitPattern = new RegExp('(V' + answers.visitNumber + ')');
    // Initialize to 1, because there will always be an underscore at the end of the pattern.
    var idLength = 1;
    var possibleFiles = [];
    var folder;

    if (typeof(paths) !== 'undefined') {
        folder = paths.data + answers.visitNumber + '/';
    } else {
        folder = 'data/';
    }

    if (answers.radarID !== '0000') {
        idPattern = new RegExp('(' + answers.radarID + '_)');
        idLength += 4;
    } else {
        idPattern = new RegExp('(' + answers.nonstandardRADARID + '_)');
        idLength += answers.nonstandardRADARID.length;
    }

    fs.readdir(folder, function (err, data) {
        if (err) {
            console.log('File not found. Let\'s try again.');
            return getIdentifyingData();
        }
        data.forEach(function (fileName) {
            if (idPattern.test(fileName.substring(0, idLength))) {
                if (visitPattern.test(fileName.substring())) {
                    possibleFiles.push(fileName);
                }
            }
        });
        confirmFile(possibleFiles, folder);
    });
}

function confirmFile(files, path) {
    if (files.length === 0) {
        console.log('No files found. Let\'s start over.');
        getIdentifyingData();
    } else {
        var confirmQuestions = [
            {
                name: 'singleConfirm',
                type: 'confirm',
                message: files[0] + '\nIs this the file you would like to correct?',
                when: files.length === 1
            },
            {
                name: 'selectBetween',
                type: 'list',
                message: 'Multiple files were found with that RADAR ID/Visit Number combination. Please select the file you would like to correct.',
                choices: files,
                when: files.length > 1
            }
        ];
        inquirer.prompt(confirmQuestions).then(function (answers) {
            loadFile(answers, files, path)
        });
    }
}

function loadFile(answers, files, path) {
    if (answers.selectBetween) {
        currentFileName = path + answers.selectBetween;
        console.log(currentFileName);
        fs.readFile(currentFileName, 'utf8', function (error, data) {
            if (error) {
                console.log(error);
                return getIdentifyingData();
            }
            // Parse data and save to currentData.
            currentData = JSON.parse(data);

            // Iterate through edge IDs to build currentEdgeIDs.
            currentData.edges.forEach(function (edge) {
                currentEdgeIDs.push(edge.id.toString());
            });

            // Iterate through node IDs to build currentNodeIDs.
            currentData.nodes.forEach(function (node) {
                currentNodeIDs.push(node.id.toString());
            });

            chooseCorrection();
        })
    } else if (answers.singleConfirm) {
        currentFileName = path + files[0];
        fs.readFile(currentFileName, 'utf8', function (error, data) {
            if (error) {
                console.log(error);
                return getIdentifyingData();
            }

            // Parse data and save to currentData.
            currentData = JSON.parse(data);

            // Iterate through edge IDs to build currentEdgeIDs.
            currentData.edges.forEach(function (edge) {
                currentEdgeIDs.push(edge.id.toString());
            });

            // Iterate through node IDs to build currentNodeIDs
            currentData.nodes.forEach(function (node) {
                currentNodeIDs.push(node.id.toString());
            });

            chooseCorrection();
        })
    } else {
        console.log('No? Let\'s try again.');
        getIdentifyingData();
    }
}

function chooseCorrection() {
    //noinspection JSUnusedGlobalSymbols
    var inspectionQuestions = [
        {
            name: 'correctionType',
            type: 'list',
            message: 'What is the first kind of correction you would like to make to this file?',
            choices: cons.correctionChoices
        },
        {
            name: 'edgeNumber',
            type: 'list',
            message: 'What is the ID on the edge would you like to correct or delete?',
            choices: currentEdgeIDs,
            when: function (answers) {
                return answers.correctionType === 'Edge update' || answers.correctionType === 'Edge deletion';
            }
        },
        {
            name: 'nodeNumber',
            type: 'list',
            message: 'What is the ID on the node you would like to correct or delete?',
            choices: currentNodeIDs,
            when: function (answers) {
                return answers.correctionType === 'Node update' || answers.correctionType === 'Node deletion';
            }
        },
        {
            name: 'newNodeType',
            type: 'list',
            message: 'What kind of node would you like to add?',
            choices: cons.nodeTypes,
            when: function (answers) {
                return answers.correctionType === 'Node creation';
            }
        },
        {
            name: 'newEdgeType',
            type: 'list',
            message: 'What kind of edge would you like to add?',
            choices: cons.edgeTypes,
            when: function (answers) {
                return answers.correctionType === 'Edge creation';
            }
        },
        {
            name: 'newInterviewerID',
            type: 'input',
            message: 'The current interviewer ID is ' + currentData.sessionParameters.interviewerID + '.\n' + 'What should it be changed to?',
            when: function (answers) {
                return answers.correctionType === 'Interviewer ID update';
            },
            validate: function (answer) {
                var pattern = /\d\d/;
                if (pattern.test(answer)) {
                    return true;
                } else {
                    return 'Please enter a valid interviewer ID. It should be a two-digit number.';
                }
            }
        },
        {
            name: 'confirmRemoval',
            type: 'confirm',
            message: (
                'Are you sure that you would like to remove this interview from the analysis set?\n' +
                'It will no longer be processed and copied to Analysis Ready.'
            ),
            when: function (answers) {
                return answers.correctionType === 'Remove interview from analysis';
            }
        }
    ];

    inquirer.prompt(inspectionQuestions).then(function (answers) {
        currentCorrectionType = answers.correctionType;
        if (answers.edgeNumber) {
            confirmID(answers.edgeNumber);
        } else if (answers.nodeNumber) {
            confirmID(answers.nodeNumber);
        } else if (answers.newNodeType) {
            createNewNode(answers.newNodeType);
        } else if (answers.newEdgeType) {
            createNewEdge(answers.newEdgeType);
        } else if (answers.newInterviewerID) {
            writeCorrectionToFile(answers.newInterviewerID);
        } else if (answers.confirmRemoval) {
            writeCorrectionToFile();
        } else {
            getIdentifyingData();
        }
    });
}

function confirmID(ID) {
    var idConfirmQuestion;
    var currentObject;

    if (currentCorrectionType === 'Edge update' || currentCorrectionType === 'Edge deletion') {
        currentObject = currentData.edges[currentEdgeIDs.indexOf(ID)];
        idConfirmQuestion = {
            name: 'idConfirm',
            type: 'confirm',
            message: JSON.stringify(currentObject, null, 2) + '\nIs this the edge you want to change or delete?'
        }
    } else {
        currentObject = currentData.nodes[currentNodeIDs.indexOf(ID)];
        idConfirmQuestion = {
            name: 'idConfirm',
            type: 'confirm',
            message: JSON.stringify(currentObject, null, 2) + '\nIs this the node you want to change or delete?'
        }
    }
    inquirer.prompt(idConfirmQuestion).then(function (answers) {
        if (answers.idConfirm) {
            objectID = ID;
            if (currentCorrectionType.split(' ')[0] === 'Edge') {
                updateEdge(currentObject);
            } else {
                updateNode(currentObject);
            }
        } else {
            chooseCorrection();
        }
    });
}

function createNewEdge(edgeType) {
    var newID = Math.max.apply(null, currentEdgeIDs) + 1;
    var newEdge = {
        id: newID,
        type_t0: edgeType
    };

    // TODO: Insert questions about to and from here. Use currentNodeIDs as options for to/from values.

    if (Object.keys(cons.edgeVariables).indexOf(edgeType) !== -1) {
        // TODO: Go through the other variables.
    }

    confirmCorrection('Edge creation', newEdge);
}

function createNewNode(nodeType) {
    var newID = currentData.nodes[0].reserved_ids[currentData.nodes[0].reserved_ids.length - 1] + 1;

    var newNode = {
        id: newID,
        type_t0: nodeType
    };

    if (Object.keys(cons.nodeVariables).indexOf(nodeType) !== -1) {
        // TODO: Figure out how to iterate through all the variables and get values with inquirer.
    }

    confirmCorrection('Node creation', newNode);
}

function updateEdge(edge) {
    if (currentCorrectionType === 'Edge deletion') {
        inquirer.prompt({
            name: 'confirmDelete',
            type: 'confirm',
            message: 'Are you sure you want to delete this edge?'
        }).then(function (answers) {
            if (answers.confirmDelete) {
                writeCorrectionToFile()
            } else {
                checkForMoreCorrections();
            }
        });
    } else {
        inquirer.prompt([
            {
                name: 'updateVariables',
                type: 'checkbox',
                message: 'Which variables would you like to update or remove?',
                choices: Object.keys(edge)
            },
            {
                name: 'addVariablesConfirm',
                type: 'confirm',
                message: 'Are there any variables you would like to add to this this edge?',
                when: typeof(cons.edgeVariables[edge.type].optional) !== 'undefined'
            },
            {
                name: 'addVariables',
                type: 'checkbox',
                message: 'Which variables would you like to add to this edge?',
                choices: function () {
                    var choices = [];
                    cons.edgeVariables[edge.type].optional.forEach(function (variable) {
                        if (Object.keys(edge).indexOf(variable) === -1) {
                            choices.push(variable);
                        }
                    });
                    return choices;
                },
                when: function (answers) {
                    return answers.addVariablesConfirm;
                }
            }]).then(function (answers) {

            var variablesToModify;
            var variablesProcessed = 0;
            var corrections = [];

            if (answers.addVariables) {
                variablesToModify = answers.updateVariables.concat(answers.addVariables);
            } else {
                variablesToModify = answers.updateVariables;
            }

            console.log('\r\n(Omit an answer to indicate that the variable should be deleted.)\r\n');

            getNewVariableValue(variablesProcessed, variablesToModify, corrections, edge);

        });
    }
}

function updateNode(node) {
    // TODO: basically implement above, though it might be a tad simpler.
    console.log(currentCorrectionType + node);
}

function getNewVariableValue(loopCount, variables, correctionsSoFar, dataObject) {
    if (loopCount < variables.length) {
        var variableName = variables[loopCount];
        var currentVariableValue = dataObject[variableName];
        var newValue = '';
        var variableChangePrompt;

        if (Object.keys(cons.variableLists).indexOf(variableName) !== -1) {
            variableChangePrompt =
                {
                    name: 'newValue',
                    type: 'list',
                    choices: ['place', 'holder'],
                    message: 'The current value for ' + variableName + ' is ' + currentVariableValue + '.\n' + 'Which of the following should it be set to?'
                }
        } else if (cons.variableTypes.string.indexOf(variableName) !== -1) {
            variableChangePrompt =
                {
                    name: 'newValue',
                    type: 'input',
                    message: 'The current value for ' + variableName + ' is ' + currentVariableValue + '.\n' + 'What should it be set to?'
                    // no validate
                }
        } else if (cons.variableTypes.positiveInt.indexOf(variableName) !== -1) {
            variableChangePrompt =
                {
                    name: 'newValue',
                    type: 'input',
                    message: 'The current value for ' + variableName + ' is ' + currentVariableValue + '.\n' + 'What should it be set to?'
                    // posInt validate
                }
        } else if (cons.variableTypes.negOneToThree.indexOf(variableName) !== -1) {
            variableChangePrompt =
                {
                    name: 'newValue',
                    type: 'list',
                    choices: ['-1', '0', '1', '2', '3'],
                    message: 'The current value for ' + variableName + ' is ' + currentVariableValue + '.\n' + 'Which of the following should it be set to?'
                }
        } else if (cons.variableTypes.negOneToTwo.indexOf(variableName) !== -1) {
            variableChangePrompt =
                {
                    name: 'newValue',
                    type: 'list',
                    choices: ['-1', '0', '1', '2'],
                    message: 'The current value for ' + variableName + ' is ' + currentVariableValue + '.\n' + 'Which of the following should it be set to?'
                }
        } else if (cons.variableTypes.zeroToSix.indexOf(variableName) !== -1) {
            variableChangePrompt =
                {
                    name: 'newValue',
                    type: 'list',
                    choices: ['0', '1', '2', '3', '4', '5', '6'],
                    message: 'The current value for ' + variableName + ' is ' + currentVariableValue + '.\n' + 'Which of the following should it be set to?'
                }
        } else if (cons.variableTypes.zeroToNine.indexOf(variableName) !== -1) {
            variableChangePrompt =
                {
                    name: 'newValue',
                    type: 'list',
                    choices: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
                    message: 'The current value for ' + variableName + ' is ' + currentVariableValue + '.\n' + 'Which of the following should it be set to?'
                }
        } else if (cons.variableTypes.binary.indexOf(variableName) !== -1) {
            variableChangePrompt =
                {
                    name: 'newValue',
                    type: 'list',
                    choices: ['0', '1'],
                    message: 'The current value for ' + variableName + ' is ' + currentVariableValue + '.\n' + 'Which of the following should it be set to?'
                }
        } else if (cons.variableTypes.boolean.indexOf(variableName) !== -1) {
            variableChangePrompt =
                {
                    name: 'newValue',
                    type: 'list',
                    choices: ['true', 'false'],
                    message: 'The current value for ' + variableName + ' is ' + currentVariableValue + '.\n' + 'Which of the following should it be set to?'
                }
        } else if (cons.variableTypes.date.indexOf(variableName) !== -1) {
            variableChangePrompt =
                [
                    {
                        name: 'month',
                        type: 'input',
                        message: 'The current value for ' + variableName + ' is ' + currentVariableValue + '.\n' + 'What should the MONTH be set to? (MM)'
                    },
                    {
                        name: 'day',
                        type: 'input',
                        message: 'The current value for ' + variableName + ' is ' + currentVariableValue + '.\n' + 'What should the DAY be set to? (DD)'
                    },
                    {
                        name: 'year',
                        type: 'input',
                        message: 'The current value for ' + variableName + ' is ' + currentVariableValue + '.\n' + 'What should the YEAR be set to? (YYYY)'
                    }
                ];
        } else {
            variableChangePrompt =
                {
                    name: 'newValue',
                    type: 'input',
                    message: 'The current value for ' + variableName + ' is ' + currentVariableValue + '.\n' + 'What should it be set to?'
                    // no validate
                }
        }
        // TODO: Add checkbox items.

        inquirer.prompt(variableChangePrompt).then(
            function (answers) {
                if (answers.newValue) {
                    newValue = answers.newValue;
                } else {
                    newValue = answers.month + answers.day + answers.year
                }

                correctionsSoFar.push([variableName, newValue]);
                loopCount += 1;
                getNewVariableValue(loopCount, variables, correctionsSoFar, dataObject);
            }
        );

    } else {
        confirmCorrection(correctionsSoFar);
    }
}

function confirmCorrection(correction) {
    inquirer.prompt({
        name: 'changeApproval',
        type: 'confirm',
        message: JSON.stringify(correction, null, 2) + '\nIs this change correct?'
    }).then(function (answers) {
        if (answers.changeApproval) {
            writeCorrectionToFile(correction);
        } else {
            // TODO: Decide where to pipe back here. For now, to chooseCorrection.
            chooseCorrection();
        }
    });
}

function writeCorrectionToFile(correction) {
    var newCorrection = {
        type: currentCorrectionType,
        filename: currentFileName,
        id: objectID,
        correctData: correction
    };

    var currentCorrections = [];
    var correctionFile;

    if (typeof(paths) !== 'undefined') {
        correctionFile = paths.corrections;
    } else {
        correctionFile = './corrections.json';
    }

    fs.readFile(correctionFile, 'utf8', function (error, data) {
        if (error) {
            return console.log(error);
        }

        currentCorrections = JSON.parse(data);
        currentCorrections.push(newCorrection);

        fs.writeFile(correctionFile, JSON.stringify(currentCorrections, null, 2));
    });

    checkForMoreCorrections();
}

function checkForMoreCorrections() {
    //noinspection JSUnusedGlobalSymbols
    inquirer.prompt([
        {
            name: 'thisFileCorrections',
            type: 'confirm',
            message: 'Correction saved! Would you like to make more corrections to this file?'
        },
        {
            name: 'anyCorrections',
            type: 'confirm',
            message: 'Would you like to make corrections to another file?',
            when: function (answers) {
                return !(answers.thisFileCorrections)
            }
        }]).then(function (answers) {
        if (answers.thisFileCorrections) {
            chooseCorrection();
        } else if (answers.anyCorrections) {
            getIdentifyingData();
        } else {
            console.log('Thank you, goodbye!');
        }
    })
}
