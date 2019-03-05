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
        id: 0,
        taken: false,
        photos: [photo1, photo2],
        tags: Array.from(tagSet.values())
    };
    return slide;
}
function createHorizontalSlide(id, photo) {
    return {
        id: 0,
        taken: false,
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
    var e_6, _a, e_7, _b;
    var horizontalPhotos = photos.filter(function (photo) { return photo.orientation === 'H'; });
    var verticalPhotos = photos.filter(function (photo) { return photo.orientation === 'V'; });
    var horizontalSlides = [];
    var verticalSlides = [];
    try {
        for (var _c = __values(horizontalPhotos.entries()), _d = _c.next(); !_d.done; _d = _c.next()) {
            var _e = __read(_d.value, 2), i = _e[0], photo = _e[1];
            var slide = createHorizontalSlide(i, photo);
            horizontalSlides.push(slide);
        }
    }
    catch (e_6_1) { e_6 = { error: e_6_1 }; }
    finally {
        try {
            if (_d && !_d.done && (_a = _c["return"])) _a.call(_c);
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
    try {
        for (var _f = __values(slides.entries()), _g = _f.next(); !_g.done; _g = _f.next()) {
            var _h = __read(_g.value, 2), i = _h[0], slide = _h[1];
            slide.id = i;
        }
    }
    catch (e_7_1) { e_7 = { error: e_7_1 }; }
    finally {
        try {
            if (_g && !_g.done && (_b = _f["return"])) _b.call(_f);
        }
        finally { if (e_7) throw e_7.error; }
    }
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
function switchSlidesOnScore(slides) {
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
function swapSlidesOnScore(slides) {
    var _a;
    console.log('slides count', slides.length);
    var tags = slides[0].tags;
    for (var setSlideId = 0; setSlideId < slides.length - 1; setSlideId++) {
        //console.log('i', i);
        var ssc = [];
        for (var slideToCompareId = 0; slideToCompareId < slides.length / 14000; slideToCompareId++) {
            //console.log('s', s);
            var s1 = slides[setSlideId];
            var s2 = slides[slideToCompareId + 1];
            var sscore = compareSlides(s1, s2);
            var sc = {
                id: setSlideId,
                checkid: slideToCompareId,
                score: sscore
            };
            ssc.push(sc);
        }
        ssc = ssc.sort(function (s1, s2) {
            return s2.score - s1.score;
        });
        var slideToExchangeId = ssc[0].id;
        _a = __read([slides[setSlideId + 1], slides[slideToExchangeId]], 2), slides[slideToExchangeId] = _a[0], slides[setSlideId + 1] = _a[1];
        console.log('i', setSlideId);
    }
    return slides;
}
function createNewSlidesOnScore(slides) {
    console.log('slides count', slides.length);
    var newSlides = [];
    var _loop_2 = function (setSlideId) {
        var s = slides[setSlideId];
        var tags = s.tags.length;
        var filteredSlides = slides.filter(function (x) { return x.tags.length === tags; });
        console.log('filtered', filteredSlides.length);
        var maxScore = -1;
        var bestSlide = slides[setSlideId + 1];
        for (var slideToCompareId = 0; slideToCompareId < filteredSlides.length - 1; slideToCompareId++) {
            var s2 = slides[slideToCompareId + 1];
            if (s === s2 || s2.taken) {
                continue;
            }
            var score = compareSlides(s, s2);
            if (score > maxScore) {
                bestSlide = s2;
            }
            if (score >= tags - 2) {
                break;
            }
        }
        newSlides.push(s);
        newSlides.push(bestSlide);
        slides[bestSlide.id].taken = true;
        console.log('i', setSlideId);
    };
    for (var setSlideId = 0; setSlideId < slides.length - 1; setSlideId++) {
        _loop_2(setSlideId);
    }
    return newSlides;
}
function reset(f) {
    numPhotos = 0;
    photos = [];
    allTags = new Map();
    // Solve this file
    readFile(f);
}
var files = [
    // "./files/a_example.txt",
    "./files/b_lovely_landscapes.txt",
];
// Solve all files
files.forEach(function (f) {
    reset(f);
    console.log("Starting Solve");
    var slides = popularSolve();
    slides = createNewSlidesOnScore(slides);
    //slides = switchSlidesOnScore(slides);
    // Create output
    var slideshow = { slides: slides, score: 0 };
    slideshow.score = getScore(slideshow);
    var score1 = slideshow.score;
    console.log(f + ': Score1 ' + score1);
    // let slides2: Slide[] = popularSolve();
    // // Create output
    // let slideshow2: Slideshow = {slides: slides2,score: 0};
    // slideshow2.score = getScore(slideshow2);
    // let score2 = slideshow2.score;
    // reset(f);
    // let slides3: Slide[] = tagSolve();
    // //slides3 = switchSlidesOnScore(slides3);
    // // Create output
    // let slideshow3: Slideshow = {slides: slides3,score: 0};
    // slideshow3.score = getScore(slideshow3);
    // let score3 = slideshow3.score;
    // console.log(f + ': Score3 ' + score3);
    createOutput(slideshow, f.substring(f.lastIndexOf('/') + 1, f.lastIndexOf(".")));
});
