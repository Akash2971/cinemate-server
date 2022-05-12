const express = require('express')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const path = require('path')
const authRoute = require('./routes/auth');
dotenv.config();


mongoose.connect(
    process.env.DB_CONNECT,
    { useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify : false },
        ()=> console.log('Connected to database !')
        );
        
const app = express();
const port = process.env.PORT || 4000

app.use(express.static("public"))
//Middlewares
app.use(cookieParser())
app.use(cors({
    credentials: true,
    origin: 'http://localhost:3000'
}))
app.use(express.json());
//Route Middlewares
app.use(express.static(path.join(__dirname, 'build')));

app.use('/',authRoute);
app.get('/*', function(req,res) {
		res.sendFile(path.join(__dirname, 'build', 'index.html'));
});
app.listen(port,()=>console.log("Server running at port 4000"));