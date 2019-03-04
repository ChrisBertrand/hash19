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
        var orientation = parts[0];
        var numTags = parseFloat(parts[1]);
        var tags = [];
        for (var i = 0; i < numTags; i++) {
            tags = __spread(tags, [parts[i + 2]]);
        }
        var photo = {
            id: photoIndex,
            orientation: orientation,
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
        var slideScore = compareSlides(slideshow.slides[i], slideshow.slides[i + 1]);
        //console.log(`Slide ${i} Score: ${slideScore}`);
        score += slideScore;
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
        tags: Array.from(tagSet.values()),
        checked: false
    };
    return slide;
}
function createHorizontalSlide(photo) {
    return {
        photos: [photo],
        tags: photo.tags,
        checked: false
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
function popularSolve() {
    var e_5, _a;
    // Sort TagEntries by most popular
    var tagEntries = Array.from(allTags.values());
    tagEntries = tagEntries.sort(function (tagEntry1, tagEntry2) {
        return tagEntry2.photoIds.length - tagEntry1.photoIds.length;
    });
    var sortedPhotoIds = [];
    tagEntries.forEach(function (tagEntry) {
        tagEntry.photoIds.forEach(function (photoId) {
            sortedPhotoIds.push(photoId);
        });
    });
    sortedPhotoIds = __spread(new Set(sortedPhotoIds));
    var sortedPhotos = [];
    try {
        for (var sortedPhotoIds_1 = __values(sortedPhotoIds), sortedPhotoIds_1_1 = sortedPhotoIds_1.next(); !sortedPhotoIds_1_1.done; sortedPhotoIds_1_1 = sortedPhotoIds_1.next()) {
            var photoId = sortedPhotoIds_1_1.value;
            var photo = photos[photoId];
            sortedPhotos.push(photo);
        }
    }
    catch (e_5_1) { e_5 = { error: e_5_1 }; }
    finally {
        try {
            if (sortedPhotoIds_1_1 && !sortedPhotoIds_1_1.done && (_a = sortedPhotoIds_1["return"])) _a.call(sortedPhotoIds_1);
        }
        finally { if (e_5) throw e_5.error; }
    }
    photos = sortedPhotos;
    return putTogether(photos);
}
function tagSolve() {
    // Sort photos by their tag score
    photos = photos.sort(function (photo1, photo2) {
        photo1.tagScore = calculateTagScore(photo1);
        photo2.tagScore = calculateTagScore(photo2);
        return photo2.tagScore - photo1.tagScore;
    });
    return putTogether(photos);
}
function putTogether(photos) {
    var e_6, _a;
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
    catch (e_6_1) { e_6 = { error: e_6_1 }; }
    finally {
        try {
            if (horizontalPhotos_1_1 && !horizontalPhotos_1_1.done && (_a = horizontalPhotos_1["return"])) _a.call(horizontalPhotos_1);
        }
        finally { if (e_6) throw e_6.error; }
    }
    for (var i = 0; i < verticalPhotos.length; i += 2) {
        if (i + 1 >= verticalPhotos.length) {
            // We have run out of photos to pair with!
            break;
        }
        var slide = createVerticalSlide(verticalPhotos[i], verticalPhotos[i + 1]);
        verticalSlides.push(slide);
    }
    // Zip arrays together
    var slides = [];
    slides = __spread(horizontalSlides, verticalSlides);
    // let maxLength = Math.max(horizontalSlides.length, verticalSlides.length);
    // for(var i = 0; i < maxLength; i++) {
    //     if (i < horizontalSlides.length) {
    //         slides.push(horizontalSlides[i]);
    //     }
    //     if (i < verticalSlides.length) {
    //         slides.push(verticalSlides[i]);
    //     }
    // }
    return slides;
}
function threelooksort(slides) {
    for (var l = 0; l < 15; l++) {
        for (var s = 0; s < slides.length - 4; s++) {
            var s1 = slides[s];
            var s2 = slides[s + 1];
            var score = compareSlides(s1, s2);
            var s3 = slides[s + 2];
            var score2 = compareSlides(s1, s3);
            var s4 = slides[s + 3];
            var score3 = compareSlides(s1, s4);
            //console.log(`score1: ${score} score2: ${score2}`);
            if (score2 > score && score3 < score2) {
                var b = slides[s + 2];
                slides[s + 2] = slides[s + 1];
                slides[s + 1] = b;
            }
            else if (score3 > score) {
                var c = slides[s + 3];
                slides[s + 3] = slides[s + 1];
                slides[s + 1] = c;
            }
        }
    }
    return slides;
}
function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}
function randomSlideSort(slides, numberOfChecks) {
    var _a;
    if (numberOfChecks === void 0) { numberOfChecks = 100; }
    console.log('slides length', slides.length);
    for (var indexSlide = 0; indexSlide < slides.length - 1; indexSlide++) {
        var slideScores = [];
        for (var cpSlide = 0; cpSlide < numberOfChecks; cpSlide++) {
            // pick a random
            if (indexSlide === cpSlide)
                continue;
            var randomId = getRandomInt(slides.length);
            console.log('randomId', randomId);
            var score = compareSlides(slides[indexSlide], slides[randomId]);
            var sc = { id: indexSlide,
                checkid: cpSlide,
                score: score
            };
            slideScores.push(sc);
        }
        var newSlideScores = slideScores.sort(function (s1, s2) {
            return s2.score - s1.score;
        });
        console.log('ss', newSlideScores[0], newSlideScores[1]);
        var slideToSwap = newSlideScores[0].checkid;
        _a = __read([slides[slideToSwap], slides[indexSlide + 1]], 2), slides[indexSlide + 1] = _a[0], slides[slideToSwap] = _a[1];
        console.log('slide on: ', indexSlide);
    }
    return slides;
}
function sortSlidesBrute(slides, divideSlidesCheck) {
    var _a;
    if (divideSlidesCheck === void 0) { divideSlidesCheck = 100; }
    console.log('slides length', slides.length);
    for (var indexSlide = 0; indexSlide < slides.length - 1; indexSlide++) {
        var slideScores = [];
        for (var cpSlide = 0; cpSlide < slides.length / divideSlidesCheck; cpSlide++) {
            if (indexSlide === cpSlide)
                continue;
            var score = compareSlides(slides[indexSlide], slides[cpSlide]);
            var sc = { id: indexSlide,
                checkid: cpSlide,
                score: score
            };
            slideScores.push(sc);
        }
        var newSlideScores = slideScores.sort(function (s1, s2) {
            return s2.score - s1.score;
        });
        var slideToSwap = newSlideScores[0].checkid;
        _a = __read([slides[slideToSwap], slides[indexSlide + 1]], 2), slides[indexSlide + 1] = _a[0], slides[slideToSwap] = _a[1];
        console.log('slide on: ', indexSlide);
    }
    return slides;
}
function singleSort(slides) {
    console.log('slides length', slides.length);
    var plus1 = slides.length / 2 + 1;
    var _loop_2 = function (indexSlide) {
        var slideScores = [];
        for (var cpSlide = 0; cpSlide < slides.length; cpSlide++) {
            if (indexSlide === cpSlide)
                continue;
            var score = compareSlides(slides[indexSlide], slides[cpSlide]);
            var sc = { id: indexSlide,
                checkid: cpSlide,
                score: score
            };
            slideScores.push(sc);
        }
        var newSlideScores = slideScores.sort(function (s1, s2) {
            return s2.score - s1.score;
        });
        var newSlides = [];
        var slideToSwap = newSlideScores[0].checkid;
        newSlideScores.forEach(function (ss) {
            newSlides.push({ photos: slides[ss.checkid].photos, tags: slides[ss.checkid].tags, checked: true });
        });
        slides = __spread(newSlides);
        console.log('slide on: ', indexSlide);
    };
    for (var indexSlide = slides.length / 2; indexSlide < plus1; indexSlide++) {
        _loop_2(indexSlide);
    }
    return slides;
}
function reset() {
    numPhotos = 0;
    photos = [];
    allTags = new Map();
}
var files = [
    // "./files/a_example.txt",
    // "./files/b_lovely_landscapes.txt",
    // "./files/c_memorable_moments.txt",
    // "./files/d_pet_pictures.txt",
    "./files/e_shiny_selfies.txt"
];
// Solve all files
files.forEach(function (f) {
    reset();
    // Solve this file
    readFile(f);
    var slides = tagSolve();
    //slides = threelooksort(slides);
    //slides = randomSlideSort(slides, 10);
    slides = singleSort(slides);
    // Create output
    var slideshow = { slides: slides, score: 0 };
    slideshow.score = getScore(slideshow);
    var score1 = slideshow.score;
    console.log(f + ': Score1 ' + score1);
    // let slides3: Slide[] = tagSolve();
    // // Create output
    // let slideshow3: Slideshow = {slides: slides3,score: 0};
    // slideshow3.score = getScore(slideshow3);
    // let score3 = slideshow3.score;
    // console.log(f + ': Score3 ' + score3);
    createOutput(slideshow, f.substring(f.lastIndexOf('/') + 1, f.lastIndexOf(".")));
});
