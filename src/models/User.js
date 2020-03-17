const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./Task');

/* in order to use middleware in mongoose, we have to create a schema and then pass it to modal */

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        minlength:5
    },
    email:{
        type:String,
        unique:true, //this makes a user unique with email, just like an id
        required:true,
        trim:true,
        lowercase:true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error("Invalid email");
            }
        }
    },
    age:{
        type:Number,
        default:0,
        validate(value){
            if(value<0){
                throw new Error("Age must be a positive number");
            }
        }
    },
    password:{
        type:String,
        required:true,
        trim:true,
        minlength:6,
        validate(value){
            if(value.toLowerCase().includes('password')){
                throw new Error("password should not contain password");
            }
        }
    },
    tokens:[{
        token:{
            type:String,
            required:true
        }
    }],
    avatar:{
        type:Buffer
    }
},{
    timestamps:true // this will give another two reconrds in documents. createdAt and updatedAt.
});


userSchema.virtual('tasks', {
    ref:'Task',
    localField:'_id',
    foreignField:'owner'
})

//for hiding puposes we are writing a method on user (instance);
/*
    userSchema.methods.hidePrivateData =  function(){ -->original name

    If it is the name, we need to chnage the route code everywhere.
    instead we can change the name to toJSON() --> when we are sending the response, 
    express will call JSON.stringify() --> which in turn call the toJSON() method on object, if it available. 
*/
userSchema.methods.toJSON =  function(){
    console.log("inside hidePrivateData")
    const user = this;

    const userObject = user.toObject(); 
    //mongoose document will have toObject() method, which removes all mongoose un-necessary methods.

    delete userObject['password'];
    delete userObject['tokens'];
    return userObject;
}

// generating token for a user, which works on userSchema instance.
// we will be saving tokens to track the user logins.
userSchema.methods.generateAuthToken = async function(){ //this represents user.
    const user = this;
    const token = jwt.sign({ _id : user._id.toString()}, process.env.JWT_SECRET);
    user.tokens = user.tokens.concat({ token });
    await user.save();
    return token;
};

// defining a custom function which finds user by email and password
userSchema.statics.findByEmailAndPwd = async ({email, password}) => {
    const user = await User.findOne({ email : email });
    if(!user){
        throw new Error('Unable to login.');
    }

    const isMatched = await bcrypt.compare(password,user.password);
    if(!isMatched){
        throw new Error('Unable to login.');
    }

    return user;
}



/* Middleware for hasing the password before saving it in db 

    to work this middleware, we have to change update nethod to treditonal one. because findByIdAndUpdate will bypass this middleware.
*/
userSchema.pre('save', async function(next){

    if(this.isModified('password')){ // here this means current document being saved.
        this.password = await bcrypt.hash(this.password,8);
    }
    next(); // this is to say that our code execution done, go to next.
});


/* this is for removing tasks, when the user before deleted */
userSchema.pre('remove', async function(next){  //next parameter is mandatory.
    //this represents user obj
    await Task.deleteMany({owner:this._id});
    next();
});


const User = mongoose.model("User", userSchema);


module.exports = User;