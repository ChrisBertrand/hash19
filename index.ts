
import * as fs from 'fs';

let numPhotos: number;
let photos: Photo[] = [];

let allTags: Map<string, TagEntry> = new Map<string, TagEntry>();

interface SlideScore {
    id: number,
    checkid: number,
    score: number;
}
interface TagEntry {
    tag: string;
    photoIds: number[]
}

interface Photo {
    id: number;
    orientation: string;
    tags: string[];
    isSelected: boolean;
    tagScore: number;
}

interface Slide {
    taken: boolean;
    id: number;
    photos: Photo[];
    tags: string[];
}

interface Slideshow {
    slides: Slide[],
    score: number
}

function readFile(filename: string) {
    const inputFile = filename;

    // Read data from file
    let data = fs.readFileSync(inputFile, "utf-8");

    let dataByLine: string[] = data.split("\n");

    const firstLine: string = <string>dataByLine.shift();
    numPhotos = parseFloat(firstLine);

    let photoIndex: number = 0;

    // Establish parameters
    for (let line of dataByLine) {

        if (!line) {
            continue;
        }

        line = line.trim();

        let parts: string[] = line.split(" ");
        let orientation: string = parts[0];
        let numTags: number = parseFloat(parts[1]);
        let tags: string[] = [];

        for (let i = 0; i < numTags; i++) {
            tags = [...tags, parts[i + 2]];
        }

        let photo: Photo = {
            id: photoIndex,
            orientation,
            tags,
            isSelected: false,
            tagScore: 0
        };

        photo.tags.forEach(tag => {
            let tagEntry: TagEntry | undefined = allTags.get(tag);
            if (tagEntry) {
                tagEntry.photoIds.push(photo.id);
            } else {
                tagEntry = {
                    tag,
                    photoIds: [photo.id]
                }
            }
            allTags.set(tag, tagEntry);
        });

        photoIndex++;
        photos.push(photo);
    }
}

function createOutput(slideshow: Slideshow, file: string) {
    console.log('file', file);
    let wstream = fs.createWriteStream(`output/${file}.output`);
    wstream.write(slideshow.slides.length + '\n');
    slideshow.slides.forEach((s: Slide) => {
        let outputLine = '';
        s.photos.forEach((photo) => {
            outputLine += `${photo.id} `;
        });
        outputLine += `\n`;
        wstream.write(outputLine);
    });
    wstream.end();
}

function getScore(slideshow: Slideshow) {
    let score = 0;

    for (let i = 0; i < slideshow.slides.length; i++) {
        if (i == slideshow.slides.length - 1) break;
        let slideScore = compareSlides(slideshow.slides[i], slideshow.slides[i + 1]);
        //console.log(`Slide ${i} Score: ${slideScore}`);
        score += slideScore
    }

    return score;
}

function compareSlides(slide1: Slide, slide2: Slide) {

    let commonTags = 0;
    for (let tag of slide1.tags) {
        if (slide2.tags.includes(tag)) {
            commonTags++;
            continue;
        }
    }

    let uncommonLeftTags = 0;
    for (let tag of slide1.tags) {
        if (!slide2.tags.includes(tag)) {
            uncommonLeftTags++;
            continue;
        }
    }

    let uncommonRightTags = 0;
    for (let tag of slide2.tags) {
        if (!slide1.tags.includes(tag)) {
            uncommonRightTags++;
            continue;
        }
    }

    return Math.min(commonTags, uncommonLeftTags, uncommonRightTags);
}

function createVerticalSlide(photo1: Photo, photo2: Photo) {
    let tags: string[] = [];
    tags = tags.concat(photo1.tags);
    tags = tags.concat(photo2.tags);
    let tagSet: Set<string> = new Set(tags);
    let slide: Slide = {
        id: 0,
        taken: false,
        photos: [photo1, photo2],
        tags: Array.from(tagSet.values())
    };
    return slide;
}

function createHorizontalSlide(id: number, photo: Photo) {
    return {
        id: 0,
        taken:false,
        photos: [photo],
        tags: photo.tags
    };
}

function calculateTagScore(photo: Photo): number {
    let score = 0;
    photo.tags.forEach(tag => {
        let tagEntry: TagEntry | undefined = allTags.get(tag);
        if (tagEntry) {
            score += tagEntry.photoIds.length;
        }
    });
    return score;
}

function popularSolve() {
    // Sort TagEntries by most popular
    let tagEntries: TagEntry[] = Array.from(allTags.values());
    tagEntries = tagEntries.sort((tagEntry1, tagEntry2) => {
        return tagEntry2.photoIds.length - tagEntry1.photoIds.length
    });

    let sortedPhotoIds: number[] = [];

    tagEntries.forEach(tagEntry => {
        tagEntry.photoIds.forEach(photoId => {
            sortedPhotoIds.push(photoId);
        })
    });

    sortedPhotoIds = [...new Set<number>(sortedPhotoIds)];

    let sortedPhotos: Photo[] = [];

    for (let photoId of sortedPhotoIds) {
        let photo = photos[photoId];
        sortedPhotos.push(photo);
    }

    photos = sortedPhotos;

    return putTogether(photos);
}
function tagSolve() {
    // Sort photos by their tag score
    photos = photos.sort((photo1, photo2) => {
        photo1.tagScore = calculateTagScore(photo1);
        photo2.tagScore = calculateTagScore(photo2);
        return photo2.tagScore - photo1.tagScore;
    });

    return putTogether(photos);
}

function putTogether(photos: Photo[]) {
    const horizontalPhotos: Photo[] = photos.filter(photo => photo.orientation === 'H');
    const verticalPhotos: Photo[] = photos.filter(photo => photo.orientation === 'V');

    const horizontalSlides: Slide[] = [];
    const verticalSlides: Slide[] = [];

    for (const [i, photo] of horizontalPhotos.entries()) {
        let slide: Slide = createHorizontalSlide(i, photo);
        horizontalSlides.push(slide);
    }

    for (let i = 0; i < verticalPhotos.length; i += 2) {
        if (i + 1 >= verticalPhotos.length) {
            // We have run out of photos to pair with!
            break;
        }
        let slide: Slide = createVerticalSlide(
            verticalPhotos[i],
            verticalPhotos[i + 1]
        );
        verticalSlides.push(slide);
    }

    // Zip arrays together
    let slides: Slide[] = [];

    slides = [...horizontalSlides, ...verticalSlides];

    for (const [i, slide] of slides.entries()) {
        slide.id = i;
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

function switchSlidesOnScore(slides: Slide[]) {
    for (let l = 0; l < 15; l++) {
        for (let s = 0; s < slides.length - 4; s++) {
            let s1 = slides[s];
            let s2 = slides[s + 1];
            let score = compareSlides(s1, s2);
            let s3 = slides[s + 2];
            let score2 = compareSlides(s1, s3);
            let s4 = slides[s + 3];
            let score3 = compareSlides(s1, s4);
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

function swapSlidesOnScore(slides: Slide[]) {
    console.log('slides count', slides.length);
    let tags = slides[0].tags;
    for (let setSlideId = 0; setSlideId < slides.length - 1; setSlideId++) {
        //console.log('i', i);
        let ssc: SlideScore[] = []

        for (let slideToCompareId = 0; slideToCompareId < slides.length / 14000; slideToCompareId++) {
            //console.log('s', s);
            let s1 = slides[setSlideId];
            let s2 = slides[slideToCompareId + 1];

            let sscore = compareSlides(s1, s2);
            let sc: SlideScore = {
                id: setSlideId,
                checkid: slideToCompareId,
                score: sscore
            }
            ssc.push(sc);
        }

        ssc = ssc.sort((s1, s2) => {
            return s2.score - s1.score;
        });

        let slideToExchangeId = ssc[0].id;
        [slides[slideToExchangeId], slides[setSlideId + 1]] = [slides[setSlideId + 1], slides[slideToExchangeId]];
        console.log('i', setSlideId);
    }
    return slides;
}

function createNewSlidesOnScore(slides: Slide[]) {
    console.log('slides count', slides.length);
    let newSlides :Slide[] = [];

    for (let setSlideId = 0; setSlideId < slides.length - 1; setSlideId++) {
        let s = slides[setSlideId];
        let tags = s.tags.length;

        let filteredSlides = slides.filter(x => x.tags.length === tags);
        console.log('filtered', filteredSlides.length);
        let maxScore = -1;
        let bestSlide:Slide = slides[setSlideId + 1];

        for (let slideToCompareId = 0; slideToCompareId < filteredSlides.length - 1; slideToCompareId++) {
            
            let s2 = slides[slideToCompareId + 1];
            if (s === s2 || s2.taken) {continue;}

            let score = compareSlides(s, s2);

            if (score > maxScore){
                bestSlide = s2;
            }

            if (score >= tags - 2){
                break;
            }
        }

        newSlides.push(s);
        newSlides.push(bestSlide);
        slides[bestSlide.id].taken = true;

      
        console.log('i', setSlideId);
    }
    return newSlides;
}

function reset(f) {
    numPhotos = 0;
    photos = [];
    allTags = new Map<string, TagEntry>();
    // Solve this file
    readFile(f);
}

const files = [
    // "./files/a_example.txt",
    "./files/b_lovely_landscapes.txt",
    // "./files/c_memorable_moments.txt",
    // "./files/d_pet_pictures.txt",
    // "./files/e_shiny_selfies.txt"
];

// Solve all files
files.forEach(f => {
    reset(f);
    console.log("Starting Solve");

    let slides: Slide[] = popularSolve();

    slides = createNewSlidesOnScore(slides);
    //slides = switchSlidesOnScore(slides);
    // Create output
    let slideshow: Slideshow = { slides: slides, score: 0 };
    slideshow.score = getScore(slideshow);
    let score1 = slideshow.score;

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

    createOutput(
        slideshow,
        f.substring(f.lastIndexOf('/') + 1, f.lastIndexOf("."))
    );
});