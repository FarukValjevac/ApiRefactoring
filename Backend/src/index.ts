import express from 'express';
import { errorHandler } from './error-handler.middleware';

// because of the javascript module, we need to use require to import the legacy routes
import legacyMembershipRoutes from './legacy/routes/membership.routes';

const app = express();
const port = 3099;

app.use(express.json());
app.use('/legacy/memberships', legacyMembershipRoutes);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
