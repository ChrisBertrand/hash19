"use strict";
exports.__esModule = true;
var fs = require("fs");
var files = [
    "./files/a_example.txt",
];
var numPhotos;
var photos = [];
var horizontalPhotos = [];
var verticalPhotos = [];
var allTags = new Map();
function readFile(filename) {
    var inputFile = filename;
    // Read data from file
    var data = fs.readFileSync(inputFile, "utf-8");
    var dataByLine = data.split("\n");
    var firstLine = dataByLine.shift();
    numPhotos = parseFloat(firstLine);
    var photoIndex = 0;
    var _loop_1 = function (line) {
        if (!line) {
            return "continue";
        }
        line = line.trim();
        var parts = line.split(" ");
        var orientation_1 = parts[0];
        var numTags = parseFloat(parts[1]);
        var tags = [];
        for (var i = 0; i < numTags; i++) {
            tags = tags.concat([parts[i + 2]]);
        }
        var photo = {
            id: photoIndex,
            orientation: orientation_1,
            tags: tags,
            isSelected: false
        };
        console.log(photo.tags);
        photo.tags.forEach(function (tag) {
            var photoIds = allTags.get(tag);
            if (photoIds) {
                photoIds.push(photo.id);
                console.log('tag ' + tag + ' added to existing list');
            }
            else {
                photoIds = [photo.id];
                console.log('tag ' + tag + ' added to new list');
            }
            allTags.set(tag, photoIds);
        });
        photoIndex++;
        photos.push(photo);
    };
    // Establish parameters
    for (var _i = 0, dataByLine_1 = dataByLine; _i < dataByLine_1.length; _i++) {
        var line = dataByLine_1[_i];
        _loop_1(line);
    }
    horizontalPhotos = photos.filter(function (photo) { return photo.orientation === 'H'; });
    verticalPhotos = photos.filter(function (photo) { return photo.orientation === 'V'; });
}
function createOutput(slideshow, file) {
    console.log('file', file);
    var wstream = fs.createWriteStream(".output/" + file + ".output");
    wstream.write(slideshow.slides.length + '\n');
    slideshow.slides.forEach(function (s) {
        s.photos.forEach(function (photo) {
            wstream.write(photo.id + " ");
        });
        wstream.write("\n");
    });
    wstream.end();
}
function getScore(slideshow) {
    //slideshow.slides.forEach(slide => slide..)
}
function compareSlides(slide1, slide2) {
    var factor1;
    var factor2;
    var factor3;
}
function createVerticalSlide(photo1, photo2) {
    var tags = [];
    tags = tags.concat(photo1.tags);
    tags = tags.concat(photo2.tags);
    var tagSet = new Set(tags);
    var slide = {
        photos: photos,
        tags: Array.from(tagSet.values())
    };
    return slide;
}
function createHorizontalSlide(photo) {
    return {
        photos: [photo],
        tags: photo.tags
    };
}
function solve() {
    var slides = [];
    for (var _i = 0, horizontalPhotos_1 = horizontalPhotos; _i < horizontalPhotos_1.length; _i++) {
        var photo = horizontalPhotos_1[_i];
        var slide = createHorizontalSlide(photo);
        slides.push(slide);
    }
    for (var i = 0; i < verticalPhotos.length; i += 2) {
        if (i + 1 >= verticalPhotos.length) {
            // We have run out of photos to pair with!
            break;
        }
        var slide = createVerticalSlide(verticalPhotos[i], verticalPhotos[i + 1]);
        slides.push(slide);
    }
    return slides;
}
// Solve all files
files.forEach(function (f) {
    // Solve this file
    readFile(f);
    var slides = solve();
    console.log(allTags);
    // Create output
    var slideshow = {
        slides: slides,
        score: 0
    };
    createOutput(slideshow, f.substring(f.lastIndexOf('/') + 1, f.lastIndexOf(".")));
});
