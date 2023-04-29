import  mongoose from   'mongoose';

const pySchema = new mongoose.Schema({
    email:{
        type:String,
        required:true

    },features: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
    
      count_limit: {
        type: Number,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      
      package_code: {
        type: String,
        required: false,
      },
   
});


export default mongoose.model.PaySchema || mongoose.model('PAYMENT', pySchema);