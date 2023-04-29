import mongoose from "mongoose";

export const PackSchema = new mongoose.Schema({
  features: {
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
    required: true,
    unique:true
  },
});

const Package = mongoose.model("PACK", PackSchema);
const createDocument = async () => {
  try {
    const pack = new Package({
      name: "package-1",
      features: "This is Testing Package 1",
      count_limit: 100,
      price: 100,
      package_code: "ajdjalgdkjlajgaldhgajhgdgag",
    });
    const newpack = new Package({
      name: "package-2",
      features: "This is Testing Package 2",
      count_limit: 200,
      price: 200,
      package_code: "djhdghakjghakjhdgkajhgkdjhgk",
    });
    const result = await Package.insertMany([pack, newpack]);
  } catch (error) {}
};
createDocument();

export default Package
