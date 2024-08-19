const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2')

const weightEntrySchema = new mongoose.Schema({
    weight :{
        type : Number,
        required : [true, 'Weight is required'],
        min : 0
    },
    created_at :{
        type : Date,
        immutable : true,//cannot be changed once entered
        default : ()=> Date.now() //by default date at time of entry 
    },
    updated_at : {
        type : Date,
        default : ()=> Date.now()
    }
});

const userSchema = new mongoose.Schema({
    name : {
        type : String,
        required: [true, 'Name is required'],
        maxlength: [300, 'Name cannot exceed 300 characters']
    },
    email: {
        type:String,
        required:[true, 'Email field is required'],
        unique: true
    },
    password :{
        type : String,
        required:[true, 'Password fields is required'],
        minlength: [6, 'Password requires atleast 6 characters !!!!']
    },
    profile_picture : {
        type : String
    },
    height : {
        type : Number,
        required: [true, 'Height is required'],
        min : 0
    },
    initial_weight : {
        type : Number,
        required: [true, 'Current weight is required'],
        min : 0
    },
    created_at :{
        type : Date,
        immutable : true,//cannot be changed once entered
        default : ()=> Date.now() //by default date at time of entry 
    },
    updated_at : {
        type : Date,
        default : ()=> Date.now()
    },
    weightEntries : [weightEntrySchema] 
});

userSchema.plugin(mongoosePaginate);
const User = mongoose.model('User', userSchema);

module.exports = User;