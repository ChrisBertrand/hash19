"use strict";
exports.__esModule = true;
var fs = require("fs");
var numPhotos;
var photos = [];
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
            isSelected: false,
            tagScore: 0
        };
        photo.tags.forEach(function (tag) {
            var tagEntry = allTags.get(tag);
            if (tagEntry) {
                tagEntry.photoIds.push(photo.id);
            }
            else {
                tagEntry = {
                    tag: tag,
                    photoIds: [photo.id]
                };
            }
            allTags.set(tag, tagEntry);
        });
        photoIndex++;
        photos.push(photo);
    };
    // Establish parameters
    for (var _i = 0, dataByLine_1 = dataByLine; _i < dataByLine_1.length; _i++) {
        var line = dataByLine_1[_i];
        _loop_1(line);
    }
}
function createOutput(slideshow, file) {
    console.log('file', file);
    var wstream = fs.createWriteStream("output/" + file + ".output");
    wstream.write(slideshow.slides.length + '\n');
    slideshow.slides.forEach(function (s) {
        var outputLine = '';
        s.photos.forEach(function (photo) {
            outputLine += photo.id + " ";
        });
        outputLine += "\n";
        wstream.write(outputLine);
    });
    wstream.end();
}
function getScore(slideshow) {
    var score = 0;
    for (var i = 0; i < slideshow.slides.length; i++) {
        if (i == slideshow.slides.length - 1)
            break;
        score += compareSlides(slideshow.slides[i], slideshow.slides[i + 1]);
    }
    return score;
}
function compareSlides(slide1, slide2) {
    var commonTags = 0;
    for (var _i = 0, _a = slide1.tags; _i < _a.length; _i++) {
        var tag = _a[_i];
        if (slide2.tags.includes(tag)) {
            commonTags++;
            continue;
        }
    }
    var uncommonLeftTags = 0;
    for (var _b = 0, _c = slide1.tags; _b < _c.length; _b++) {
        var tag = _c[_b];
        if (!slide2.tags.includes(tag)) {
            uncommonLeftTags++;
            continue;
        }
    }
    var uncommonRightTags = 0;
    for (var _d = 0, _e = slide2.tags; _d < _e.length; _d++) {
        var tag = _e[_d];
        if (!slide1.tags.includes(tag)) {
            uncommonRightTags++;
            continue;
        }
    }
    return Math.min(commonTags, uncommonLeftTags, uncommonRightTags);
}
function createVerticalSlide(photo1, photo2) {
    var tags = [];
    tags = tags.concat(photo1.tags);
    tags = tags.concat(photo2.tags);
    var tagSet = new Set(tags);
    var slide = {
        photos: [photo1, photo2],
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
function calculateTagScore(photo) {
    var score = 0;
    photo.tags.forEach(function (tag) {
        var tagEntry = allTags.get(tag);
        if (tagEntry) {
            score += tagEntry.photoIds.length;
        }
    });
    return score;
}
function solve() {
    // Sort TagEntries by most popular (UNUSED)
    // let tagEntries: TagEntry[] = Array.from(allTags.values());
    // tagEntries = tagEntries.sort((tagEntry1, tagEntry2) => {
    //     return tagEntry2.photoIds.length - tagEntry1.photoIds.length
    // })
    // Sort photos by their tag score
    photos = photos.sort(function (photo1, photo2) {
        photo1.tagScore = calculateTagScore(photo1);
        photo2.tagScore = calculateTagScore(photo2);
        return photo2.tagScore - photo1.tagScore;
    });
    var horizontalPhotos = photos.filter(function (photo) { return photo.orientation === 'H'; });
    var verticalPhotos = photos.filter(function (photo) { return photo.orientation === 'V'; });
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
function reset() {
    numPhotos = 0;
    photos = [];
    allTags = new Map();
}
var files = [
    "./files/a_example.txt",
    "./files/b_lovely_landscapes.txt",
    "./files/c_memorable_moments.txt",
    "./files/d_pet_pictures.txt",
    "./files/e_shiny_selfies.txt"
];
// Solve all files
files.forEach(function (f) {
    reset();
    // Solve this file
    readFile(f);
    var slides = solve();
    // Create output
    var slideshow = {
        slides: slides,
        score: 0
    };
    slideshow.score = getScore(slideshow);
    console.log(f + ': ' + slideshow.score);
    createOutput(slideshow, f.substring(f.lastIndexOf('/') + 1, f.lastIndexOf(".")));
});
