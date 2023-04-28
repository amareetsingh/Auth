const mongoose = require('mongoose');

export const chatList = new mongoose.Schema({
    email:{
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
    }
   
});

export default mongoose.model.ChatList  || mongoose.model('CHATLIST', chatList)