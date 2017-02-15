module.exports = function () {
    // Load NPM packages.
    var fs = require('fs');
    var inquirer = require('inquirer');

    // Import constant values and path values (if provided).
    var cons = require('./constants.js');
    try {
        var paths = require('./paths.js');
    } catch (e) {
    }

    // Initialize filename and data variables in global scope.
    var currentFileName;
    var currentData;
    var currentNodeIDs;
    var currentEdgeIDs;
    var objectID;
    var currentCorrectionType;

    // Run initial prompt.
    getIdentifyingData();

    // Initial prompt that takes ID and visit number.
    function getIdentifyingData() {
        // Initialize/empty these global variables.
        currentFileName = '';
        currentData = {};
        currentEdgeIDs = [];
        currentNodeIDs = [];

        inquirer.prompt(cons.fileIdentifyingQuestions).then(findFiles);
    }

    // Searches for files that parameters given.
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

    // Ask the user to select between matching files.
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

    // Read in selected file.
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

    // Ask the user which kind of correction they want to make + other basic info.
    function chooseCorrection() {
        var intID;
        if (typeof(currentData.sessionParameters) !== 'undefined') {
            intID = currentData.sessionParameters.interviewerID;
        }

        objectID = null;

        var inspectionQuestions = [
            {
                name: 'correctionType',
                type: 'list',
                message: 'What is the kind of correction you would like to make to this file?',
                pageSize: 9,
                choices: cons.correctionChoices
            },
            {
                name: 'edgeNumber',
                type: 'list',
                message: 'What is the ID on the edge would you like to correct?',
                choices: currentEdgeIDs,
                when: function (answers) {
                    return answers.correctionType === 'Edge update';
                }
            },
            {
                name: 'nodeNumber',
                type: 'list',
                message: 'What is the ID on the node you would like to correct?',
                choices: currentNodeIDs,
                when: function (answers) {
                    return answers.correctionType === 'Node update';
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
                },
                filter: function (response) {
                    return response.split('/')[0];
                }
            },
            {
                name: 'newInterviewerID',
                type: 'input',
                message: 'The current interviewer ID is ' + intID + '.\n' + 'What should it be changed to?',
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
                createNode(answers.newNodeType);
            } else if (answers.newEdgeType) {
                createEdge(answers.newEdgeType);
            } else if (currentCorrectionType === 'Node deletion' || currentCorrectionType === 'Edge deletion') {
                deleteObjects();
            } else if (answers.newInterviewerID) {
                writeCorrectionToFile({interviewerID: answers.newInterviewerID});
            } else if (answers.confirmRemoval) {
                writeCorrectionToFile();
            } else if (answers.correctionType === 'Renumber nodes/edges') {
                renumberIDs();
            } else {
                getIdentifyingData();
            }
        });
    }

    // If an edge or node ID was given, show the user the object they selected and confirm that it is the object they want to correct.
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

    /*
     If previous data is loaded incorrectly, duplicate node IDs for different alters may occur. Thus, we increment the
     IDs of alters elicited during the problematic interview, to make sure there is no overlap.
     */
    function renumberIDs() {
        inquirer.prompt([
            {
                name: 'start',
                type: 'list',
                choices: currentNodeIDs.filter(function (id) {
                    return id !== '0'
                }),
                message: 'Which is the first node that needs to be renumbered?'
            },
            {
                name: 'offset',
                type: 'input',
                message: 'What number needs to be added to each affected node ID?',
                validate: function (answer) {
                    var pattern = /\d+/;
                    if (pattern.test(answer) && parseInt(answer, 10) > 0) {
                        return true;
                    } else {
                        return 'Please enter a positive whole number.';
                    }
                }
            }
        ]).then(function (answers) {
            confirmCorrection({
                start: parseInt(answers.start, 10),
                offset: parseInt(answers.offset, 10)
            });
        });
    }

    // Creates base edge and determines which other variables will be added. Begin recursion through these variables.
    function createEdge(edgeType) {
        var newEdge = {
            type: edgeType
        };

        inquirer.prompt(
            [
                {
                    name: 'from',
                    type: 'list',
                    message: 'Who is this edge `from`?',
                    choices: currentNodeIDs.concat('Other node id')
                },
                {
                    name: 'otherFrom',
                    type: 'input',
                    message: 'Who is this edge `from`?',
                    when: function (answers) {
                        return answers.from === 'Other node id';
                    },
                    validate: function (answer) {
                        var pattern = /\d+/;
                        if (pattern.test(answer) && currentNodeIDs.indexOf(answer) === -1) {
                            return true;
                        } else {
                            return 'Please enter a valid node ID that was not in the list provided.';
                        }
                    }
                },
                {
                    name: 'to',
                    type: 'list',
                    message: 'Who is this edge `to`?',
                    choices: function (answers) {
                        // 'to' cannot be '0' or the same as 'from'
                        function isValidToValue(id) {
                            return id !== answers.from && id !== '0';
                        }

                        // Give the option to manually enter `to`, since a new node may have been created.
                        return currentNodeIDs.filter(isValidToValue).concat('Other node id');
                    }
                },
                {
                    name: 'otherTo',
                    type: 'input',
                    message: 'Who is this edge `to`?',
                    when: function (answers) {
                        return answers.to === 'Other node id';
                    },
                    validate: function (answer, answers) {
                        var pattern = /\d+/;
                        // test that the answer is a positive integer, not 0, not already in the list given, and
                        // not the same as the `otherFrom` value. `from` value test not needed because that would be in the list.
                        if (pattern.test(answer) &&
                            currentNodeIDs.indexOf(answer) === -1 &&
                            answer !== '0' &&
                            answer !== answers.otherFrom) {
                            return true;
                        } else {
                            return 'Please enter a valid node ID that was not in the list provided.';
                        }
                    }
                }
            ]
        ).then(function (answers) {
            // Add `to` to the edge.
            if (answers.otherTo) {
                newEdge.to = parseInt(answers.otherTo, 10);
            } else {
                newEdge.to = parseInt(answers.to, 10);
            }

            // Add `from` to the edge.
            if (answers.otherFrom) {
                newEdge.from = parseInt(answers.otherFrom, 10);
            } else {
                newEdge.from = parseInt(answers.from, 10);
            }

            // If this edge has variables other than id/type/to/from, grab those.
            if (Object.keys(cons.edgeVariables).indexOf(edgeType) !== -1) {
                var requiredVars = cons.edgeVariables[edgeType].required;
                var optionalVars = cons.edgeVariables[edgeType].optional;
            }

            inquirer.prompt(
                {
                    name: 'optionalVariables',
                    type: 'checkbox',
                    message: 'Which, if any, of the following optional variables you would like to add to this this edge?',
                    when: typeof(optionalVars) !== 'undefined',
                    choices: optionalVars
                }).then(function (answers) {

                var optionalVars = answers.optionalVariables;
                var variablesToAdd;
                var variablesProcessed = 0;

                if (optionalVars && requiredVars) {
                    variablesToAdd = requiredVars.concat(answers.optionalVariables);
                } else if (optionalVars) {
                    variablesToAdd = optionalVars;
                } else if (requiredVars) {
                    variablesToAdd = requiredVars;
                } else {
                    confirmCorrection(newEdge);
                }

                getNewVariableValue(variablesProcessed, variablesToAdd, newEdge);
            });
        });
    }

    // Creates node edge and determines which other variables will be added. Begin recursion through these variables.
    function createNode(nodeType) {
        objectID = currentData.nodes[0].reserved_ids[currentData.nodes[0].reserved_ids.length - 1] + 1;

        var newNode = {
            type_t0: nodeType
        };

        if (nodeType === 'HIVService') {
            inquirer.prompt({
                name: 'name',
                type: 'input',
                message: 'What is the name of this service provider?'
            }).then(function (answers) {
                newNode.name = answers.name;
                confirmCorrection(newNode);
            })
        } else {
            confirmCorrection(newNode);
        }

    }

    // Determine which nodes or edges to delete.
    function deleteObjects() {
        var deletePrompt;

        if (currentCorrectionType === 'Edge deletion') {
            deletePrompt = {
                name: 'toDelete',
                type: 'checkbox',
                message: 'Which edges would you like to delete? Select all that apply.',
                choices: currentEdgeIDs,
                validate: function (response) {
                    if (response.length > 0) {
                        return true;
                    } else {
                        return 'Please select at least one edge to delete.'
                    }
                }
            };
        } else {
            deletePrompt = {
                name: 'toDelete',
                type: 'checkbox',
                message: 'Which nodes would you like to delete? Select all that apply.',
                choices: currentNodeIDs,
                validate: function (response) {
                    if (response.length > 0) {
                        return true;
                    } else {
                        return 'Please select at least one node to delete.'
                    }
                }
            }
        }

        inquirer.prompt(deletePrompt).then(function (answers) {
                confirmCorrection({
                    ids: answers.toDelete
                })
            }
        )
    }

    // Determine which variables will be updated/added/removed. Begin recursion through these variables.
    function updateEdge(edge) {
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
            var corrections = {};

            if (answers.addVariables) {
                variablesToModify = answers.updateVariables.concat(answers.addVariables);
            } else {
                variablesToModify = answers.updateVariables;
            }

            getNewVariableValue(variablesProcessed, variablesToModify, corrections, edge);
        });
    }

    // Determine which variables will be updated/added/removed. Begin recursion through these variables.
    function updateNode(node) {
        inquirer.prompt([
            {
                name: 'updateVariables',
                type: 'checkbox',
                message: 'Which variables would you like to update or remove?',
                choices: Object.keys(node)
            },
            {
                name: 'addVariablesConfirm',
                type: 'confirm',
                message: 'Are there any variables you would like to add to this this node?',
                when: node.type_t0 === 'Ego'
            },
            {
                name: 'addVariables',
                type: 'checkbox',
                message: 'Which variables would you like to add to this node?',
                choices: function () {
                    var choices = [];
                    cons.egoVariables.forEach(function (variable) {
                        if (Object.keys(node).indexOf(variable) === -1) {
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
            var corrections = {};

            if (answers.addVariables) {
                variablesToModify = answers.updateVariables.concat(answers.addVariables);
            } else {
                variablesToModify = answers.updateVariables;
            }

            getNewVariableValue(variablesProcessed, variablesToModify, corrections, node);

        });
    }

    /*
     Recursively accumulate new variable values for all needed variables. When all variables have been assigned
     new values, pass the accumulated data to confirmCorrections.
     */
    function getNewVariableValue(loopCount, variables, correctionsSoFar, dataObject) {
        if (loopCount < variables.length) {
            var variableName = variables[loopCount];

            if (dataObject) {
                var currentVariableValue = dataObject[variableName];
            }

            var newValue = '';
            var variableChangePrompt;

            // Initialize an array that will hold 0 or 1 item.
            var deleteChoice = [];

            // If the variable is in the 'deletableVariables' array in constants.js,
            // push the option '[Delete]' which will be displayed as the last choice in the `choices` array.
            if (cons.deletableVariables.indexOf(variableName) !== -1) {
                deleteChoice = ['[Delete]'];
            }

            if (cons.tractVariables.indexOf(variableName) !== -1) {
                variableChangePrompt = [
                    {
                        name: 'newValue',
                        type: 'list',
                        choices: cons.variableLists[variableName].concat(deleteChoice),
                        message: 'The current value for ' + variableName + ' is ' + currentVariableValue + '.\nWhich of the following should it be set to?'
                    },
                    {
                        name: 'newTract',
                        type: 'input',
                        message: 'What census tract should ' + variableName + ' be set to? \ngeo_5jrd-6zik-',
                        when: function (answers) {
                            return answers.newValue === 'Census Tract';
                        },
                        validate: function (answer) {
                            if (cons.chicagoCensusTracts.indexOf('geo_5jrd-6zik-' + answer) !== -1) {
                                return true;
                            } else {
                                return 'Please enter only the portion of the census tract (as found in Network Canvas) that comes after "geo_5jrd-6zik-".';
                            }
                        }
                    }
                ]
            } else if (variableName === 'details') {
                variableChangePrompt =
                    {
                        name: 'newValue',
                        type: 'checkbox',
                        choices: cons.variableCheckboxes[dataObject.type],
                        message: 'The current value for ' + variableName + ' is ' + currentVariableValue + '.\nWhich of the following should it be set to? Select ALL that apply.'
                    }
            } else if (variableName === 'radar_id') {
                variableChangePrompt =
                    {
                        name: 'newValue',
                        type: 'input',
                        message: 'The current value for ' + variableName + ' is ' + currentVariableValue + '.\nWhat should it be set to?',
                        validate: function (response) {
                            var pattern = /^\d\d\d\d$/;
                            if (pattern.test(response)) {
                                return true;
                            } else {
                                return 'Please enter 4 digits.';
                            }
                        }
                    }
            } else if (Object.keys(cons.variableLists).indexOf(variableName) !== -1) {
                variableChangePrompt =
                    {
                        name: 'newValue',
                        type: 'list',
                        choices: cons.variableLists[variableName].concat(deleteChoice),
                        message: 'The current value for ' + variableName + ' is ' + currentVariableValue + '.\nWhich of the following should it be set to?'
                    }
            } else if (cons.variableTypes.string.indexOf(variableName) !== -1) {
                variableChangePrompt =
                    {
                        name: 'newValue',
                        type: 'input',
                        message: 'The current value for ' + variableName + ' is ' + currentVariableValue + '.\nWhat should it be set to?'
                    }
            } else if (cons.variableTypes.positiveInt.indexOf(variableName) !== -1) {
                variableChangePrompt =
                    {
                        name: 'newValue',
                        type: 'input',
                        message: 'The current value for ' + variableName + ' is ' + currentVariableValue + '.\nWhat should it be set to?',
                        validate: function (answers) {
                            var pattern = /\d+/;
                            if (pattern.test(answers) && parseInt(answers, 10) >= 0) {
                                return true;
                            } else {
                                return 'Please enter a non-negative whole number.';
                            }
                        }
                    }
            } else if (cons.variableTypes.negOneToThree.indexOf(variableName) !== -1) {
                variableChangePrompt =
                    {
                        name: 'newValue',
                        type: 'list',
                        choices: ['-1', '0', '1', '2', '3'].concat(deleteChoice),
                        message: 'The current value for ' + variableName + ' is ' + currentVariableValue + '.\nWhich of the following should it be set to?'
                    }
            } else if (cons.variableTypes.negOneToTwo.indexOf(variableName) !== -1) {
                variableChangePrompt =
                    {
                        name: 'newValue',
                        type: 'list',
                        choices: ['-1', '0', '1', '2'].concat(deleteChoice),
                        message: 'The current value for ' + variableName + ' is ' + currentVariableValue + '.\nWhich of the following should it be set to?'
                    }
            } else if (cons.variableTypes.oneToNine.indexOf(variableName) !== -1) {
                variableChangePrompt =
                    {
                        name: 'newValue',
                        type: 'list',
                        choices: ['1', '2', '3', '4', '5', '6', '7', '8', '9'].concat(deleteChoice),
                        message: 'The current value for ' + variableName + ' is ' + currentVariableValue + '.\nWhich of the following should it be set to?'
                    }
            } else if (cons.variableTypes.binary.indexOf(variableName) !== -1) {
                variableChangePrompt =
                    {
                        name: 'newValue',
                        type: 'list',
                        choices: ['0', '1'].concat(deleteChoice),
                        message: 'The current value for ' + variableName + ' is ' + currentVariableValue + '.\nWhich of the following should it be set to?'
                    }
            } else if (cons.variableTypes.boolean.indexOf(variableName) !== -1) {
                variableChangePrompt =
                    {
                        name: 'newValue',
                        type: 'list',
                        choices: ['true', 'false'].concat(deleteChoice),
                        message: 'The current value for ' + variableName + ' is ' + currentVariableValue + '.\nWhich of the following should it be set to?'
                    }
            } else if (cons.variableTypes.date.indexOf(variableName) !== -1) {
                variableChangePrompt =
                    [
                        {
                            name: 'newValue',
                            type: 'list',
                            choices: ['null', 'Date'].concat(deleteChoice),
                            message: 'The current value for ' + variableName + ' is ' + currentVariableValue + '.\nWhich of the following should it be set to?',
                            when: variableName === 'sex_first_t0'
                        },
                        {
                            name: 'month',
                            type: 'input',
                            message: 'The current value for ' + variableName + ' is ' + currentVariableValue + '.\nWhat should the MONTH be set to? (MM)',
                            validate: function (answers) {
                                var pattern = /\d\d/;
                                if (pattern.test(answers) && parseInt(answers, 10) <= 12 && parseInt(answers, 10) >= 1) {
                                    return true;
                                } else {
                                    return 'Please enter a valid month in the format "MM".';
                                }
                            },
                            when: function (answers) {
                                return variableName === 'sex_last_t0' || answers.newValue === 'Date';
                            }
                        },
                        {
                            name: 'day',
                            type: 'input',
                            message: 'The current value for ' + variableName + ' is ' + currentVariableValue + '.\nWhat should the DAY be set to? (DD)',
                            validate: function (answers) {
                                var pattern = /\d\d/;
                                if (pattern.test(answers) && parseInt(answers, 10) <= 31 && parseInt(answers, 10) >= 1) {
                                    return true;
                                } else {
                                    return 'Please enter a valid day in the format "DD".';
                                }
                            },
                            when: function (answers) {
                                return variableName === 'sex_last_t0' || answers.newValue === 'Date';
                            }

                        },
                        {
                            name: 'year',
                            type: 'input',
                            message: 'The current value for ' + variableName + ' is ' + currentVariableValue + '.\nWhat should the YEAR be set to? (YYYY)',
                            validate: function (answers) {
                                var pattern = /\d\d\d\d/;
                                var maxYear = new Date().getFullYear();
                                if (pattern.test(answers) && parseInt(answers, 10) <= maxYear && parseInt(answers, 10) >= 1900) {
                                    return true;
                                } else {
                                    return 'Please enter a valid year in the format "YYYY".';
                                }
                            },
                            when: function (answers) {
                                return variableName === 'sex_last_t0' || answers.newValues === 'Date';
                            }
                        }
                    ];
            } else {
                variableChangePrompt =
                    {
                        name: 'newValue',
                        type: 'input',
                        message: 'The current value for ' + variableName + ' is ' + currentVariableValue + '.\nWhat should it be set to?'
                    }
            }

            inquirer.prompt(variableChangePrompt).then(
                function (answers) {
                    if (answers.year) {
                        newValue = answers.month + '/' + answers.day + '/' + answers.year
                    } else if (answers.newValue === 'Census Tract') {
                        newValue = 'geo_5jrd-6zik-' + answers.newTract;
                    } else {
                        newValue = answers.newValue;
                    }

                    // Test equality *with* type coercion. Leave RADAR IDs as strings.
                    if (newValue == parseInt(newValue, 10) && variableName !== 'radar_id') {
                        newValue = parseInt(newValue, 10);
                    }

                    correctionsSoFar[variableName] = newValue;
                    loopCount += 1;
                    getNewVariableValue(loopCount, variables, correctionsSoFar, dataObject);
                }
            );

        } else {
            confirmCorrection(correctionsSoFar);
        }
    }

    // Display the correction to the user and confirm whether it is correct.
    function confirmCorrection(correction) {
        inquirer.prompt({
            name: 'changeApproval',
            type: 'confirm',
            message: currentCorrectionType + '\n' + JSON.stringify(correction, null, 2) + '\nIs this change correct?'
        }).then(function (answers) {
            if (answers.changeApproval) {
                writeCorrectionToFile(correction);
            } else {
                // TODO: Decide where to pipe back here. For now, to chooseCorrection.
                chooseCorrection();
            }
        });
    }

    // If the correction was confirmed, add it to corrections.json.
    function writeCorrectionToFile(correction) {
        var newCorrection = {
            type: currentCorrectionType,
            correctData: correction,
            timestamp: Date.now()
        };

        if (objectID) {
            newCorrection.id = parseInt(objectID, 10);
        }

        var currentCorrections = {};
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

            if (Object.keys(currentCorrections).indexOf(currentFileName) === -1) {
                currentCorrections[currentFileName] = [newCorrection];
            } else {
                currentCorrections[currentFileName].push(newCorrection);
            }

            fs.writeFile(correctionFile, JSON.stringify(currentCorrections, null, 2));
        });

        checkForMoreCorrections();
    }

    // After a correction is saved, ask the user for more corrections to this or other files. Pipe back as necessary.
    function checkForMoreCorrections() {
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
};
