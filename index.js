
function readFile(filename){
    const fs = require("fs");
    const inputFile = filename;
    
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
    obj.forEach(s => wstream.write(`${s} \n`));
    wstream.end();
}

readFile("./input/a_example.in");
