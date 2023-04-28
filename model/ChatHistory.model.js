const mongoose = require('mongoose');


const chatHistory = new mongoose.Schema({
    token:{
        type:String,
        required:true
    },
    chat_id:{
        type:String,
        required:true
    },
    chat_name:{
        type:String,
        required:true
    },
    chat_industry:{
        type:String,
        required:true
    },
    chat_max_tokens:{
        type:Number,
        required:true
    },
    generate_word:{
        type:Number,
        required:true
    },
    response_text:{
        type:String,
        required:true
    }
   
});


export default mongoose.model.ChatHistory || mongoose.model('CHATHISTORY', chatHistory);