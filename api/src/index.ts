import express from 'express';

const app = express();
const port = process.env.PORT || 8080;

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Express v5 on Cloud Run!' });
});

app.listen(port, () => {
  console.log(`✅ Server listening on port ${port}`);
});
