import mongoose from 'mongoose';

const photoSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
}, { strict: false, versionKey: false });

export default mongoose.model('Photo', photoSchema);
