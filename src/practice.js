const mongoose=require("mongoose");
const signupSchema=new mongoose.Schema({
    name:{
        type:String,
    },
    email:{
        type:String,
    },
    phone:{
        type:String,
    }
})
const Signup=mongoose.model('signup',signupSchema);
module.exports=Signup;