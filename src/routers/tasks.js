const express = require('express');
const Task = require('../models/Task');
const auth = require('../middlewares/auth');

const router = express.Router();


/* End point for creating tasks */
router.post('/tasks', auth, async (req, res) => {
    //const data = req.body;
    try{
        const task = new Task({
            ...req.body,
            'owner':req.user._id //include the user id as owner for that task.
        });
        await task.save();
        res.status(201).send(task);
    }catch(e){
        res.send(400).send(e);
    }
});

/* End poit for fetching all tasks 

GET /tasks?completed=true/false 
GET /tasks?limit=10&skip=0 -->fetches first 10 records.
GET /tasks?limit=10&skip=10 --> fetches next 10 records.
*/
router.get('/tasks', auth, async (req, res) => {
    try {
        const match = {};
        const sort = {};

        if(req.query.completed){
            match.completed = req.query.completed === 'true';
        }
        
        if(req.query.sortBy){
            const sortVal = req.query.sortBy.split(":");
            sort[sortVal[0]] = sortVal[1]==='asc'? 1 : -1 ;
        }
        console.log(sort);
        //const tasks = await Task.find({});
        //const tasks = await Task.find({'owner':req.user._id}); ==>old
        //we can use populate method to 
        //await req.user.populate('tasks').execPopulate(); ==> old
        await req.user.populate({
            path:'tasks',
            match,
            options:{
                limit : parseInt(req.query.limit),
                skip : parseInt(req.query.skip),
                sort
            }
        }).execPopulate();
        res.send(req.user.tasks);
    } catch (error) {
        res.status(500).send(error);
    }
});

/* End point for fetching Task by id */
router.get('/tasks/:id', auth, async (req, res) => { //make it authenticated first.
    const _id = req.params.id;
    try {
        //const task = await Task.findById(_id); ====> older.
        const task = await Task.findOne({_id, 'owner':req.user._id}) //fetch the task with owner and id combination.
        if(!task){
            return res.status(404).send();
        }
        res.send(task);
    } catch (e) {
        res.status(500).send(e);
    }

});

/* Update task */
router.patch('/tasks/:id', auth, async (req, res) => {
    /* Checking is there any unknown field, which is not there in schema */
    const allowedFields = Object.keys(Task.schema.obj);
    const updates = Object.keys(req.body);
    const isValidUpdate = updates.every((update) => allowedFields.includes(update));
    
    if(!isValidUpdate){
        return res.status(400).send({"error":"invalid update"});
    }

    try {
        
        //const task = await Task.findById(req.params.id); ==> older

        const task = await Task.findOne({_id:req.params.id,owner:req.user._id});

        if(!task){
            return res.status(404).send();
        }


        updates.forEach((update) => {
            task[updates] =  req.body[update];
        })
        await task.save();
        //findByIdAndUpdate will bypass some middleware functions, so we have to update it in traditional manner.
        //const task = await Task.findByIdAndUpdate(req.params.id, req.body, {new:true, runValidators:true});
        
        res.send(task);
    } catch (e) {
        res.status(400).send(e);
    };
});

/* Deleting task by id */
router.delete('/tasks/:id', auth, async (req,res) => {
    try {
        // const task = await Task.findByIdAndDelete(req.params.id); ==> old
        const task = await Task.findOne({_id : req.params.id, owner : req.user._id});
        if(!task){
            return res.status(404).send(); //if there is no task exists with the given id
        }
        task.remove(); //fist finding task and removing.
        res.send(task);
    } catch (e) {
        res.status(500).send(e); // if any internal server errors;
    }
});

module.exports = router;