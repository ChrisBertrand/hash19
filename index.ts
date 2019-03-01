
import * as fs from 'fs';
import { hostname } from 'os';

let numPhotos: number;
let photos: Photo[] = [];

let allTags: Map<string, TagEntry> = new Map<string, TagEntry>();

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
    photos: Photo[];
    tags: string[];
}

interface SlidePair {
    slide1: Slide;
    slide2: Slide;
    score: Number;
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

    const firstLine: string = <string> dataByLine.shift();
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
            tags = [...tags, parts[i+2]];
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

function createOutput(slideshow : Slideshow, file: string) {
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
        photos: [photo1, photo2],
        tags: Array.from(tagSet.values())
    };
    return slide;
}

function createHorizontalSlide(photo: Photo) {
    return {
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

function calculateTagScoreForSlide(slide: Slide): number {
    let score = 0;
    slide.photos.forEach(photo => {
        photo.tags.forEach(tag => {
            let tagEntry: TagEntry | undefined = allTags.get(tag);
            if (tagEntry) {
                score += tagEntry.photoIds.length;
            }
        });
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

    return putTogether(photos, false);
}
function tagSolve() {
    // Sort photos by their tag score
    photos = photos.sort((photo1, photo2) => {
        photo1.tagScore = calculateTagScore(photo1);
        photo2.tagScore = calculateTagScore(photo2);
        return photo2.tagScore - photo1.tagScore;
    });

    return putTogether(photos, true);
}

function putTogether(photos: Photo[], finalSort: Boolean) {
    const horizontalPhotos: Photo[] = photos.filter(photo => photo.orientation === 'H');
    const verticalPhotos: Photo[] = photos.filter(photo => photo.orientation === 'V');

    const horizontalSlides: Slide[] = [];
    const verticalSlides: Slide[] = [];

    for (const photo of horizontalPhotos) {
        let slide: Slide = createHorizontalSlide(photo);
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

    if (finalSort){
        for (let l = 0; l < 20; l++){
            for (let s = 0; s < slides.length - 2; s++){
                let s1 = slides[s];
                let s2 = slides[s + 1];
                let score = compareSlides(s1, s2);

                let s3 = slides[s + 2];
                let score2 = compareSlides(s1, s3);

                //console.log(`score1: ${score} score2: ${score2}`);
                if (score2 > score) {
                    var b = slides[s+2];
                    slides[s+2] = slides[s+1];
                    slides[s+1] = b;
                }
            }
        }
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

function reset() {
    numPhotos = 0;
    photos = [];
    allTags = new Map<string, TagEntry>();
}

const files = [
    // "./files/a_example.txt",
    "./files/b_lovely_landscapes.txt",
    "./files/c_memorable_moments.txt",
    "./files/d_pet_pictures.txt",
    "./files/e_shiny_selfies.txt"
];

// Solve all files
files.forEach(f => {
    reset();
    
    // Solve this file
    readFile(f);
    
    let slides: Slide[] = tagSolve();
    // Create output
    let slideshow: Slideshow = {slides: slides,score: 0};
    slideshow.score = getScore(slideshow);
    let score1 = slideshow.score;

    console.log(f + ': Score1 ' + score1);

    // let slides2: Slide[] = popularSolve();
    // // Create output
    // let slideshow2: Slideshow = {slides: slides2,score: 0};
    // slideshow2.score = getScore(slideshow2);
    // let score2 = slideshow2.score;

    createOutput(
        slideshow, 
        f.substring(f.lastIndexOf('/')+1, f.lastIndexOf("."))
    );
});