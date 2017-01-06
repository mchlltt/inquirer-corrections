# Inquirer Corrections
A command-line Node.js tool for collecting JSON data corrections from a user. Inquirer is the application's primary dependency. 

## Prerequisites
- Node.js
- npm

## Getting Started
- Clone the repository.
- Run `npm install` to install Inquirer and its dependencies.
- Follow the data preparation instructions below.
- Run `node app.js`.

## Data preparation
- Fill out and remove the `-template` from `corrections-template.json` before use. `corrections.json` is included in the `.gitignore`.
- If you would like to demo the app's functionality with synthetic data, the program will default to using the data in `data/`.
- If you would like to use your own data, fill out and remove the `-template` from `paths-template.js` before use. `paths.js` is included in the `.gitignore`.
