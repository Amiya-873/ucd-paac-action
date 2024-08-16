/* ========================================================================== *
 * Copyright (C) 2024 HCL America Inc.                                        *
 * All rights reserved.                                                       *
 * Licensed under Apache 2 License.                                           *
 * ========================================================================== */
const { spawn } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

var url = process.env.INPUT_DEPLOYURL;
var user = process.env.INPUT_USERNAME;
var password = process.env.INPUT_PASSWORD;
var inputFileDirectory = process.env.INPUT_INPUTFILEDIRECTORY;
var inputFile = path.join(inputFileDirectory, 'myData.json');

var command = createCommand(inputFile);

if (!command) {
    console.error("Failed to create the command. Exiting.");
    process.exit(1);
}


var processArgs = command.split(' ');

var runpProcess = spawn(processArgs[0], processArgs.slice(1), { stdio: ['pipe', 'pipe', 'pipe'] });

var rl;
setTimeout(() => {
    rl = readline.createInterface({
        input: runpProcess.stdout,
        output: runpProcess.stdin,
        terminal: false
    });
}, 5000);

runpProcess.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
    if (data.toString().includes('password:')) {
        runProcess.stdin.write(password + '\n');
    }
});


rl.on('line', (line) => {
    console.log(line);
    // If the password prompt appears in stdout, provide the password
    if (line.includes('password:')) {
        runProcess.stdin.write(password + '\n');
    }
});


runpProcess.on('close', (code) => {
    if (code !== 0) {
        console.error(`Process exited with code ${code}`);
    }
});

function createCommand(inputFilePath) {
    var command = '';
    try {
        var data = fs.readFileSync(inputFilePath, 'utf8');
        var jsonObject = JSON.parse(data);

        if (jsonObject.processType === "generic") {
            command = `./ucd-paac-action/artifacts/pacc-0.1.0.9999999-SNAPSHOT/upload-generic-process ${user} ${password} ${url} ${jsonObject.processName} ${jsonObject.processVersion} ${inputFile}`;
        } else if (jsonObject.processType === 'application') {
            command = `./ucd-paac-action/artifacts/pacc-0.1.0.9999999-SNAPSHOT/upload-application-process ${user} ${password} ${url} ${jsonObject.processName} ${jsonObject.parent} ${inputFile}`;
        } else if (jsonObject.processType === 'component') {
            command = `./ucd-paac-action/artifacts/pacc-0.1.0.9999999-SNAPSHOT/upload-component-process ${user} ${password} ${url} ${jsonObject.processName} ${jsonObject.parent} ${inputFile}`;
        } else {
            throw new Error(`Unknown processType: ${jsonObject.processType}`);
        }

        return command;
    } catch (err) {
        console.error(`Error reading or parsing ${inputFilePath}:`, err);
        return null;
    }
}
