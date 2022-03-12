const express = require('express');
const app = express();
const mongoose = require('mongoose');
const dotenv = require('dotenv').config();
const cors = require('cors');

//ROUTES
const authRoute = require('./routes/authRoute');
const usersRoute = require('./routes/usersRoute');

//CORS
app.use(cors());

//PORT 
const PORT = process.env.PORT || 5000;

//use express.json to parse data to json 
app.use(express.json());

//Connect to database
mongoose.connect(process.env.DB_CONNECT)
.then(()=>console.log('DataBase connected'))
.catch(err=>console.log(err))

//Use app routes
app.use('/', authRoute);
app.use('/', usersRoute);


//connect to server
app.listen(PORT)
