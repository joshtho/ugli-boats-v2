// filepath: /server/index.js
const express = require('express');
const app = express();
const PORT = 3001;

app.get('/', (req, res) => {
  res.send('Hello from Node.js backend!');
});

app.get('/api/greet', (req, res) => {
  res.json({ message: 'Hello from /api/greet!' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});