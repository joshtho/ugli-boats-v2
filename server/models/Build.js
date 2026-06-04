import mongoose from 'mongoose';

// strict: false allows any fields from the existing JSON structure to be saved
const buildSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
}, { strict: false, versionKey: false });

export default mongoose.model('Build', buildSchema);
