import express from 'express';

import users from './routes/users';
import trailers from './routes/trailers';
import reservations from './routes/reservations';

const app = express();

app.use(express.json());

app.use('/api/users', users);
app.use('/api/trailers', trailers);
app.use('/api/reservations', reservations);

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`✅ Server listening on port ${port}`);
});
