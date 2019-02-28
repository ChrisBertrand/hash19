"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
exports.__esModule = true;
var fs = require("fs");
var numPhotos;
var photos = [];
var allTags = new Map();
function readFile(filename) {
    var e_1, _a;
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
            tags = __spread(tags, [parts[i + 2]]);
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
    try {
        // Establish parameters
        for (var dataByLine_1 = __values(dataByLine), dataByLine_1_1 = dataByLine_1.next(); !dataByLine_1_1.done; dataByLine_1_1 = dataByLine_1.next()) {
            var line = dataByLine_1_1.value;
            _loop_1(line);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (dataByLine_1_1 && !dataByLine_1_1.done && (_a = dataByLine_1["return"])) _a.call(dataByLine_1);
        }
        finally { if (e_1) throw e_1.error; }
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
    var e_2, _a, e_3, _b, e_4, _c;
    var commonTags = 0;
    try {
        for (var _d = __values(slide1.tags), _e = _d.next(); !_e.done; _e = _d.next()) {
            var tag = _e.value;
            if (slide2.tags.includes(tag)) {
                commonTags++;
                continue;
            }
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (_e && !_e.done && (_a = _d["return"])) _a.call(_d);
        }
        finally { if (e_2) throw e_2.error; }
    }
    var uncommonLeftTags = 0;
    try {
        for (var _f = __values(slide1.tags), _g = _f.next(); !_g.done; _g = _f.next()) {
            var tag = _g.value;
            if (!slide2.tags.includes(tag)) {
                uncommonLeftTags++;
                continue;
            }
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (_g && !_g.done && (_b = _f["return"])) _b.call(_f);
        }
        finally { if (e_3) throw e_3.error; }
    }
    var uncommonRightTags = 0;
    try {
        for (var _h = __values(slide2.tags), _j = _h.next(); !_j.done; _j = _h.next()) {
            var tag = _j.value;
            if (!slide1.tags.includes(tag)) {
                uncommonRightTags++;
                continue;
            }
        }
    }
    catch (e_4_1) { e_4 = { error: e_4_1 }; }
    finally {
        try {
            if (_j && !_j.done && (_c = _h["return"])) _c.call(_h);
        }
        finally { if (e_4) throw e_4.error; }
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
    // Sort TagEntries by most popular
    // let tagEntries: TagEntry[] = Array.from(allTags.values());
    // tagEntries = tagEntries.sort((tagEntry1, tagEntry2) => {
    //     return tagEntry2.photoIds.length - tagEntry1.photoIds.length
    // });
    var e_5, _a;
    // let sortedPhotoIds: number[] = [];
    // tagEntries.forEach(tagEntry => {
    //     tagEntry.photoIds.forEach(photoId => {
    //         sortedPhotoIds.push(photoId);
    //     })
    // });
    // sortedPhotoIds = [...new Set<number>(sortedPhotoIds)];
    // let sortedPhotos: Photo[] = [];
    // for (let photoId of sortedPhotoIds) {
    //     let photo = photos[photoId];
    //     sortedPhotos.push(photo);
    // }
    // photos = sortedPhotos;
    // Sort photos by their tag score
    photos = photos.sort(function (photo1, photo2) {
        photo1.tagScore = calculateTagScore(photo1);
        photo2.tagScore = calculateTagScore(photo2);
        return photo2.tagScore - photo1.tagScore;
    });
    var horizontalPhotos = photos.filter(function (photo) { return photo.orientation === 'H'; });
    var verticalPhotos = photos.filter(function (photo) { return photo.orientation === 'V'; });
    var horizontalSlides = [];
    var verticalSlides = [];
    try {
        for (var horizontalPhotos_1 = __values(horizontalPhotos), horizontalPhotos_1_1 = horizontalPhotos_1.next(); !horizontalPhotos_1_1.done; horizontalPhotos_1_1 = horizontalPhotos_1.next()) {
            var photo = horizontalPhotos_1_1.value;
            var slide = createHorizontalSlide(photo);
            horizontalSlides.push(slide);
        }
    }
    catch (e_5_1) { e_5 = { error: e_5_1 }; }
    finally {
        try {
            if (horizontalPhotos_1_1 && !horizontalPhotos_1_1.done && (_a = horizontalPhotos_1["return"])) _a.call(horizontalPhotos_1);
        }
        finally { if (e_5) throw e_5.error; }
    }
    for (var i_1 = 0; i_1 < verticalPhotos.length; i_1 += 2) {
        if (i_1 + 1 >= verticalPhotos.length) {
            // We have run out of photos to pair with!
            break;
        }
        var slide = createVerticalSlide(verticalPhotos[i_1], verticalPhotos[i_1 + 1]);
        verticalSlides.push(slide);
    }
    // Zip arrays together
    var slides = [];
    var maxLength = Math.max(horizontalSlides.length, verticalSlides.length);
    for (var i = 0; i < maxLength; i++) {
        if (i < horizontalSlides.length) {
            slides.push(horizontalSlides[i]);
        }
        if (i < verticalSlides.length) {
            slides.push(verticalSlides[i]);
        }
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
