const express = require('express');
const path = require('path');
const fs = require('fs');
const util = require('util');

// Helper method for generating unique ids
const uuid = require('./helpers/uuid');

const notes = require('./db/db.json');

const PORT = process.env.PORT || 3001;

const app = express();

// Middleware for parsing JSON and urlencoded form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));

// Routes--------------------

// GET Route for homepage
app.get('/', (req, res) =>
    res.sendFile(path.join(__dirname, '/public/index.html'))
);

app.get('/notes', (req, res) =>
    res.sendFile(path.join(__dirname, '/public/notes.html'))
);
// --------------------------------------------

// Promise version of fs.readFile
const readFromFile = util.promisify(fs.readFile);

/**
 *  Function to write data to the JSON file given a destination and some content
 *  @param {string} destination The file you want to write to.
 *  @param {object} content The content you want to write to the file.
 *  @returns {void} Nothing
 */

const writeToFile = (destination, content) =>
    fs.writeFile(destination, JSON.stringify(content, null, 4), (err) =>
        err ? console.error(err) : console.info(`\nData written to ${destination}`)
    );

/**
*  Function to read data from a given a file and append some content
*  @param {object} content The content you want to append to the file.
*  @param {string} file The path to the file you want to save to.
*  @returns {void} Nothing
*/
const readAndAppend = (content, file) => {
    fs.readFile(file, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
        } else {
            const parsedData = JSON.parse(data);
            parsedData.push(content);
            writeToFile(file, parsedData);
        }
    });
};

// GET Route for retrieving all the notes
app.get('/api/notes', (req, res) => {
    console.info(`${req.method} request received for tips`);
    readFromFile('./db/db.json').then((data) => res.json(JSON.parse(data)));
});

// POST Route for a new NOTE
app.post('/api/notes', (req, res) => {
    console.info(`${req.method} request received to add a note`);

    const { title, text } = req.body;

    if (req.body) {
        const newNote = {
            title,
            text,
            id: uuid()
        };

        readAndAppend(newNote, './db/db.json');
        res.json(`Note added successfully 🚀`);
    } else {
        res.error('Error in adding tip');
    }
});

const readAndDelete = (req, file) => {
    fs.readFile(file, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
        } else {
            const parsedData = JSON.parse(data);
            let theID = parsedData.findIndex(x => x.id === req.body.id);

            if (theID > -1) { // only splice array when item is found
              parsedData.splice(theID, 1); // 2nd parameter means remove one item only
            }
            // parsedData.push(content);
            writeToFile(file, parsedData);
        }
    });
};

app.delete('/api/notes/:id', (req, res) => {
    console.info(`${req.method} request received to DELETE a NOTE`);
    console.info(req.body.id);
    readAndDelete(req, './db/db.json');
    res.json(`Note DELETED successfully`);
})

app.listen(PORT, () =>
    console.log(`Example app listening at http://localhost:${PORT}`)
);