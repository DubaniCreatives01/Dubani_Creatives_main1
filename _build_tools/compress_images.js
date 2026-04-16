const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, 'montana_clone', 'images');

let totalBefore = 0;
let totalAfter = 0;
let processed = 0;
let errors = 0;

const walkSync = (dir) => {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            results = results.concat(walkSync(filePath));
        } else if (/\.(jpg|jpeg|png|webp)$/i.test(file)) {
            results.push(filePath);
        }
    }
    return results;
};

const allImages = walkSync(imagesDir);
console.log(`Found ${allImages.length} images to compress...\n`);

const compressImage = async (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    const originalSize = fs.statSync(filePath).size;
    totalBefore += originalSize;

    try {
        const buffer = fs.readFileSync(filePath);
        let output;

        if (ext === '.jpg' || ext === '.jpeg') {
            output = await sharp(buffer)
                .jpeg({ quality: 75, mozjpeg: true })
                .toBuffer();
        } else if (ext === '.png') {
            output = await sharp(buffer)
                .png({ quality: 75, compressionLevel: 9 })
                .toBuffer();
        } else if (ext === '.webp') {
            output = await sharp(buffer)
                .webp({ quality: 70 })
                .toBuffer();
        }

        if (output && output.length < originalSize) {
            fs.writeFileSync(filePath, output);
            totalAfter += output.length;
            const saved = ((1 - output.length / originalSize) * 100).toFixed(1);
            processed++;
            if (processed % 50 === 0) {
                console.log(`  Processed ${processed}/${allImages.length}...`);
            }
        } else {
            // Keep original if compression made it bigger
            totalAfter += originalSize;
            processed++;
        }
    } catch (err) {
        errors++;
        totalAfter += originalSize;
        // Silently skip problematic files
    }
};

const run = async () => {
    // Process in batches of 10 to avoid memory issues
    const batchSize = 10;
    for (let i = 0; i < allImages.length; i += batchSize) {
        const batch = allImages.slice(i, i + batchSize);
        await Promise.all(batch.map(f => compressImage(f)));
    }

    const beforeMB = (totalBefore / 1024 / 1024).toFixed(2);
    const afterMB = (totalAfter / 1024 / 1024).toFixed(2);
    const savedMB = ((totalBefore - totalAfter) / 1024 / 1024).toFixed(2);
    const savedPct = ((1 - totalAfter / totalBefore) * 100).toFixed(1);

    console.log(`\n✅ Compression Complete!`);
    console.log(`   Images processed: ${processed}`);
    console.log(`   Errors skipped:   ${errors}`);
    console.log(`   Before: ${beforeMB} MB`);
    console.log(`   After:  ${afterMB} MB`);
    console.log(`   Saved:  ${savedMB} MB (${savedPct}%)`);
};

run();
