// scripts/hashPassword.js
import bcrypt from 'bcryptjs';

const password = 'Jordancallsherpontontika1992'; // Change this to your new password
const saltRounds = 12;

const hashedPassword = await bcrypt.hash(password, saltRounds);

console.log('=== Admin Password Configuration ===');
console.log('New hashed password:', hashedPassword);
console.log('\nUpdate your .env file with:');
console.log(`ADMIN_PASSWORD_HASH=${hashedPassword}`);
console.log(`JWT_SECRET=${generateRandomSecret()}`);

function generateRandomSecret() {
  return [...Array(32)].map(() => Math.random().toString(36)[2]).join('');
}
