
import * as fs from 'fs';

function readFile(filename: string) {
    const inputFile = filename;
    
    // Read data from file
    let data = fs.readFileSync(inputFile, "utf-8");
    
    let dataByLine = data.split("\n");
    
    // Establish parameters
    let firstRow = dataByLine[0].split(" ");
}

function createOutput(obj : any) {
    //console.log(slices);
    let wstream = fs.createWriteStream('file.output');
    wstream.write(obj.length + '\n');
    obj.forEach(s => wstream.write(`${s} \n`));
    wstream.end();
}

readFile("./input/a_example.in");

