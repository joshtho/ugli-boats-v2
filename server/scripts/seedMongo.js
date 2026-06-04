// scripts/seedMongo.js
// Seeds MongoDB Atlas with existing data from the JSON files in server/data/
// Safe to run multiple times — uses upsert so it won't create duplicates.
//
// Usage: node scripts/seedMongo.js

import { webcrypto } from 'node:crypto';
if (!globalThis.crypto) globalThis.crypto = webcrypto;

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Build from '../models/Build.js';
import Photo from '../models/Photo.js';
import Interesting from '../models/Interesting.js';
import Submission from '../models/Submission.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI || MONGODB_URI === 'your_mongodb_atlas_connection_string') {
  console.error('❌ MONGODB_URI is not set in server/.env');
  process.exit(1);
}

function readJson(filename) {
  const filePath = path.join(__dirname, '../data', filename);
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${filename} not found — skipping`);
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.error(`❌ Failed to parse ${filename}:`, e.message);
    return [];
  }
}

async function upsertAll(Model, records, label) {
  if (records.length === 0) {
    console.log(`⚠️  No ${label} records to seed`);
    return;
  }

  const ops = records.map(record => ({
    updateOne: {
      filter: { id: record.id },
      update: { $setOnInsert: record },
      upsert: true,
    },
  }));

  const result = await Model.bulkWrite(ops);
  const inserted = result.upsertedCount;
  const skipped = records.length - inserted;
  console.log(`✅ ${label}: ${inserted} inserted, ${skipped} already existed`);
}

async function main() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.\n');

  const builds = readJson('builds.json');
  const photos = readJson('photos.json');
  const interesting = readJson('interesting.json');
  const submissions = readJson('submissions.json');

  await upsertAll(Build, builds, 'Builds');
  await upsertAll(Photo, photos, 'Photos');
  await upsertAll(Interesting, interesting, 'Interesting');
  await upsertAll(Submission, submissions, 'Submissions');

  console.log('\nDone! All data seeded into MongoDB Atlas.');
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Seed failed:', err.message);
  mongoose.disconnect();
  process.exit(1);
});
