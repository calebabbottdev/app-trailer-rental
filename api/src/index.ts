import express from 'express';

import users from './routes/users';
import trailers from './routes/trailers';

const app = express();

app.use(express.json());

app.use('/api/users', users);
app.use('/api/trailers', trailers);

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`✅ Server listening on port ${port}`);
});
