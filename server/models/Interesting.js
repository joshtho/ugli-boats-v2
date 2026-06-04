import mongoose from 'mongoose';

const interestingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
}, { strict: false, versionKey: false });

export default mongoose.model('Interesting', interestingSchema);
