import  {mongoose, Schema} from "mongoose";


// Define the schema for the Post
const postSchema = new mongoose.Schema(
  {
    
    title: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    userId: {
      type : Schema.Types.ObjectId,
      required: true,
      ref: 'User' // Reference to the User model
    },
    industryId: {
      type : Schema.Types.ObjectId,
      required: true,
      ref: 'Industry' // Reference to the Industry model
    },
    
    status: {
      type: String,
      enum: ['active', 'inactive', 'deleted'],
      default: 'active'
    }
  },
  {
    timestamps: true // Automatically adds createdAt and updatedAt fields
  }
);

// Export the Post model
export const Post = mongoose.model('Post', postSchema);