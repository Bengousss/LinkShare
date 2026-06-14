require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const registrationRoutes = require('./routes/registrations');
const materialRoutes = require('./routes/materials');
const materialReservationRoutes = require('./routes/materialReservations');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/events', eventRoutes);
app.use('/registrations', registrationRoutes);
app.use('/materials', materialRoutes);
app.use('/material-reservations', materialReservationRoutes);

app.listen(3001, () => console.log('Backend running on http://localhost:3001'));