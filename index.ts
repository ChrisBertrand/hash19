
import * as fs from 'fs';


let numPhotos: number;
let photos: Photo[] = [];

let horizontalPhotos: Photo[] = [];
let verticalPhotos: Photo[] = [];

let allTags: Map<string, number[]> = new Map<string, number[]>();

interface Photo {
    id: number;
    orientation: string;
    tags: string[];
    isSelected: boolean;
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
            isSelected: false
        };

        photo.tags.forEach(tag => {
            let photoIds: number[] | undefined = allTags.get(tag);
            if (photoIds) {
                photoIds.push(photo.id);
            } else {
                photoIds = [photo.id];
            }
            allTags.set(tag, photoIds);
        });

        photoIndex++;
        photos.push(photo);
    }
    
    horizontalPhotos = photos.filter(photo => photo.orientation === 'H');
    verticalPhotos = photos.filter(photo => photo.orientation === 'V');
}

function createOutput(slideshow : Slideshow, file: string) {
    console.log('file', file);
    let wstream = fs.createWriteStream(`output/${file}.output`);
    wstream.write(slideshow.slides.length + '\n');
    slideshow.slides.forEach((s: Slide) => {
        s.photos.forEach((photo) => {
            wstream.write(`${photo.id} `)
        });
        wstream.write(`\n`);
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
        photos,
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

function solve() {

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

const files = [
    "./files/a_example.txt"
    /*"./files/b_lovely_landscapes.txt",
    "./files/c_memorable_moments.txt",
    "./files/d_pet_pictures.txt",
    "./files/e_shiny_selfies.txt"*/
];

// Solve all files
files.forEach(f => {
    
    // Solve this file
    readFile(f);
    const slides: Slide[] = solve();

    console.log(allTags);

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
