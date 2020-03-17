const express = require('express');
const User = require('../models/User');
const auth = require('../middlewares/auth');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const { sendWelcomeEmail, sednCancellationEmail } = require('../mails/account');
/* 
    Note: 
        as there is no error handling for async routes, we have to use try-catch blocks to hanldle errors if we use async routes.

        Express does not care about what you are returning from route handler (promise if we use async function). It will send the response.
*/

/* end point for creating users */
router.post("/users", async (req, res) => {
    const data = req.body;
    const user = new User(data);
    try{
        const savedUser = await user.save();
        sendWelcomeEmail(savedUser.email, savedUser.name);
        const token = await savedUser.generateAuthToken();
        res.status(201).send({user, token});
    }catch(e){
        res.status(400).send(e);
    }
});

/* login user */
router.post('/users/login', async (req, res) => { 
    try {
        const user = await User.findByEmailAndPwd(req.body);
        const token = await user.generateAuthToken();
        //res.send({user:user.hidePrivateData(),token});
        res.send({user,token}); // this will call JSON.stringify() method which will call toJSON on the obj
    } catch (e) {
        res.status(400).send();
    }
});

/* Get a user by it's id */
/*router.get('/users/:id', async (req,res) => {
    const _id = req.params.id;    
    try{
        const user = await User.findById(_id);
        if(!user){
            return res.status(404).send(); // if there is no user with id, send 404 response code.
        }
        res.send(user);
    }catch(e){
        res.status(500).send(e);
    }
});*/

/* End point for fetching all users */
router.get('/users/me',auth, async (req, res) => {
    try{
       
        //As there is no need to show all the users, we make this route as profile route.
        /*const users = await User.find({});
        res.send(users);*/

        //user is set inside auth and this route handler will execute only when user authenticated.
        //So we send the user info back as profile.
        res.send(req.user);
    }catch(e){
        res.status(500).send(e);
    }
});

/* logout from one session */
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token != req.token;
        });
        await req.user.save();
        res.send();
    } catch (error) {
        res.status(500).send();
    }
});

/* logout all sessions */
router.post('/users/logoutall', auth, async (req,res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();
    } catch (error) {
        res.status(500).send();
    }
});

/* Updating user details by id */
router.patch('/users/me',auth,async (req,res) => {
    /* Check for any invalid field that is not there in schema. if is there is any invalid field, throw an error */
    const allowedFields = Object.keys(User.schema.obj);
    const updates = Object.keys(req.body);
    const isValidUpdate = updates.every((upadate) => allowedFields.includes(upadate)); //iterates over each element and checks if it is there in schema
    if(!isValidUpdate){
        return res.status(400).send({"error":"invalid update"});
    }
    try {
        const user = req.user;

        //push the updates that are going to be done, into the found user.
        updates.forEach((update) => user[update] = req.body[update]);
        
        // this will not support middleware.
        //const user = await User.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true});

        await user.save(); //there is no need to check if the user match, beacuase we are already checking in auth.
        res.send(user);
    } catch (e) {
        res.status(400).send(e);
    }
});

/* Delete user */
/* 
    router.delete('/users/:id', async (req,res) => { --> orginal
    one user cannot delete other user account with their id, instead can delete own account.
    so modify the route
*/
router.delete('/users/me',auth, async (req,res) => {
    /* 
        Note: When a user delete himself, we have to delete his respective tasks.
        for that we can write here... or we can write a pre method to delete in user model.

    */
    
    try {
        /*
        const user = await User.findByIdAndDelete(req.user._id);

        if(!user){ -- this is not required, becuase this route get executed, only when authenticated.
            return res.status(404).send()
        }
        we are not going to use this 
        */

        await req.user.remove(); // we can use remove() method on the document to remove it.
        sednCancellationEmail(req.user.email, req.user.name);
        res.send(req.user);
    } catch (e) {
        res.status(500).send(e);
    }
});


//instatiate multer.
const profile = multer({
   //dest:"avatars",
    limits:{
        fileSize:100000
    },
    fileFilter(req, file, callback){
        if(!(/\.(jpg|jpeg|png)$/.test(file.originalname))){
            return callback(new Error("Error while uploading pic."));
        };

        callback(undefined, true);
    }
})


router.post("/users/me/avatar",auth,profile.single('avatar'),async (req, res)=>{

    const buffer = await sharp(req.file.buffer).resize({
        height:250,
        width:250
    }).png().toBuffer();

    req.user.avatar = buffer;
    await req.user.save();
    res.send();
}, (err, req, res, next) => {
    res.status(400).send({
        error:new Error(err).message
    })
});

router.delete("/users/me/avatar", auth, async (req,res) => { console.log("inside delete avatar")
    try { 
        delete req.user.avatar
        //req.user.avatar = undefined;
        await req.user.save(); 
        res.send();  
    } catch (error) {
        res.status(500).send();
    }
});


router.get("/users/:id/avatar", async (req, res) => {
    try {
        
        let user = await User.findById(req.params.id);

        if(!user || !user.avatar){
            throw new Error("error occured.");
        }
        res.set("Content-Type", "image/png"); 
        //setting content type in header we are sending in response, even if we not set anything, express will take care of it.
        res.send(user.avatar);
    } catch (_err) {
        res.status(500).send()
    }
});

module.exports = router;