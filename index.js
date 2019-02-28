"use strict";
exports.__esModule = true;
var fs = require("fs");
function readFile(filename) {
    var inputFile = filename;
    // Read data from file
    var data = fs.readFileSync(inputFile, "utf-8");
    var dataByLine = data.split("\n");
    // Establish parameters
    var firstRow = dataByLine[0].split(" ");
}
function createOutput(obj) {
    //console.log(slices);
    var wstream = fs.createWriteStream('file.output');
    wstream.write(obj.length + '\n');
    obj.forEach(function (s) { return wstream.write(s + " \n"); });
    wstream.end();
}
readFile("./input/a_example.in");
