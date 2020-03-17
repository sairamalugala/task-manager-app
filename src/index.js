const express = require('express');

require('./db/mongoose'); //Calling connection code
const User = require('./models/User'); //User model
const Task = require('./models/Task'); //Task model
const userRoute = require('./routers/users'); //User router
const taskRoute = require('./routers/tasks'); //Task router

const ObjectID = require('mongoose').ObjectID;

const PORT  = process.env.PORT;
const app = express();

app.locals.parseJSON = true;

// test express middleware
/*app.use((req,res,next) => {
    if(req.method == "POST"){
        res.send("Post methods disabled");
    }else{
        next();
    }
})*/

//maintenance middleware
/*app.use((req, res, next) => {
    res.status(503).send("under maintenance, please try after some time.");
});*/


const multer = require('multer');
const upload = multer({
    dest:"images",
    limits:{
        fieldSize:1000000
    },
    fileFilter(req, file, callback){

        if(!file.originalname.match(/\.(doc|docx)$/)){
            return callback(new Error("Please Upload Doc files.", undefined));
        }

        callback(undefined,true);
    }
});



app.post("/upload", upload.single('upload') ,(req,res) => {
    res.send();
},(err, req, res, next)=>{
    res.status(400).send({
        error: err.message
    })
});





// POC for Error handling.
const errorHandler = (req, res, next)=>{
    throw new Error("My Custom Error!");
}

app.get('/errorTest',errorHandler, (req, res)=>{
    res.send();
}, (err, req, res, next) => {
    res.status(400).send({
        error: err.message
    })
}); // Route Handler with error handling signature.
/*
    Error Handling in express.js
    ===========================

    we pass another function as an argument for route handler with four parameters,
    (error, req, res, next) ----> that when express knows it is for uncaught errors.
*/



app.use(express.json());
app.use(userRoute); //register user router with express app.
app.use(taskRoute); //register task router with express app.

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});



//const Task1 = require('./models/Task');
//const User1 = require('./models/User');

//const main = async ()=>{
   //const task = await Task1.findById('5e492b1209891704a83cf166');
   //await task.populate('owner').execPopulate();
   //console.log(task);

  // const user = await User1.findById('5e492b0509891704a83cf164');
  // await user.populate('tasks').execPopulate();
  // console.log(user.tasks); //we cannot see the virtual field when we print user directly to console.
    
//}
//main();