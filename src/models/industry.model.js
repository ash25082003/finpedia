import mongoose, { Schema } from "mongoose";

const industrySchema = new Schema(
  {
    id: { 
        type: String, 
        required: true, 
        unique: true 
    },
    name: {
        type: String,
        required: true 
    },
    description: { 
        type: String 
    },
  },
  { timestamps: true }
);

export const Industry = mongoose.model("Industry", industrySchema);