const mongoose = require('mongoose');

mongoose.connect(process.env.MONGOOSE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology:true,
    useCreateIndex:true, //when we use uniue true on any field, make sure u used this.
    useFindAndModify:false /* Mongodb native driver internally uses this */
}).then(() => {
    console.log('connected');
}).catch((e) => {
    console.log(e);
});