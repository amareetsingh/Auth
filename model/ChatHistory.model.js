import mongoose from 'mongoose';


const chatHistory = new mongoose.Schema({
   
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


export default mongoose.model.ChatHistoryModel || mongoose.model('CHATHISTORY', chatHistory);