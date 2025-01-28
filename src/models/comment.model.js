import { mongoose, Schema } from "mongoose";

// Define the schema for the Comment
const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true
    },
    userId: {
      type : Schema.Types.ObjectId,
      required: true,
      ref: 'User' // Reference to the User model
    },
    postId: {
      type : Schema.Types.ObjectId,     
      required: true,
      ref: 'Post' // Reference to the Post model
    },
    parentCommentId: {
      type : Schema.Types.ObjectId,
      ref: 'Comment' // Reference to the parent Comment (for nested comments)
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

// Export the Comment model
export const Comment = mongoose.model('Comment', commentSchema);