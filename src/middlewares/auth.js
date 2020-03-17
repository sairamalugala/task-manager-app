const User = require('../models/User');
const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
    console.log("auth middleware");
    try{
        const token = req.header('Authorization').replace("Bearer ","");
        
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findOne({'_id':payload._id,'tokens.token':token}); //Here we are searching for token inside token.token

        if(!user){
            throw new Error();
        }

        req.user = user; // setting user inside request, to access inside route handler.
        req.token = token;
        
        next();
    }catch(e){
        res.status(501).send({error:'Authorize first.'});
    }
}

module.exports = auth;