const express = require('express');
const app = express();
const cors = require('cors');
const authRoutes = require('./routes/auth');
const operationRoutes = require('./routes/operation');
const subjectRoutes = require('./routes/subjects');
const poRoutes = require('./routes/po');
const reportRoutes = require('./routes/reports');


app.use(express.json());
app.use(cors());


app.use('/api/auth', authRoutes);
app.use('/api/operation', operationRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/po', poRoutes);
app.use('/api/reports', reportRoutes);


const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});