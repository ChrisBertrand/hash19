
import * as fs from 'fs';

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
        score += compareSlides(slideshow.slides[i], slideshow.slides[i + 1]);
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

function solve() {

    // Sort TagEntries by most popular (UNUSED)
    // let tagEntries: TagEntry[] = Array.from(allTags.values());
    // tagEntries = tagEntries.sort((tagEntry1, tagEntry2) => {
    //     return tagEntry2.photoIds.length - tagEntry1.photoIds.length
    // })

    // Sort photos by their tag score
    photos = photos.sort((photo1, photo2) => {
        photo1.tagScore = calculateTagScore(photo1);
        photo2.tagScore = calculateTagScore(photo2);
        return photo2.tagScore - photo1.tagScore;
    });

    const horizontalPhotos: Photo[] = photos.filter(photo => photo.orientation === 'H');
    const verticalPhotos: Photo[] = photos.filter(photo => photo.orientation === 'V');

    const slides: Slide[] = [];

    for (const photo of horizontalPhotos) {
        let slide: Slide = createHorizontalSlide(photo);
        slides.push(slide);
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
        slides.push(slide);
    }

    return slides;
}

function reset() {
    numPhotos = 0;
    photos = [];
    allTags = new Map<string, TagEntry>();
}

const files = [
    "./files/a_example.txt",
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
    const slides: Slide[] = solve();

    // Create output
    const slideshow: Slideshow = {
        slides,
        score: 0
    };
    slideshow.score = getScore(slideshow);
    console.log(f + ': ' + slideshow.score);
    createOutput(
        slideshow, 
        f.substring(f.lastIndexOf('/')+1, f.lastIndexOf("."))
    );
});
