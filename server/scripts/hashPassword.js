// scripts/hashPassword.js
import bcrypt from 'bcryptjs';

const password = 'ugliboats2025'; // Your current password
const saltRounds = 12;

const hashedPassword = await bcrypt.hash(password, saltRounds);

console.log('=== Admin Password Configuration ===');
console.log('Original password:', password);
console.log('Hashed password:', hashedPassword);
console.log('\nAdd these to your .env file:');
console.log(`ADMIN_PASSWORD_HASH=${hashedPassword}`);
console.log(`JWT_SECRET=${generateRandomSecret()}`);

function generateRandomSecret() {
  return [...Array(32)].map(() => Math.random().toString(36)[2]).join('');
}
