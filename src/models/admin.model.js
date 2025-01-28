import mongoose , {Schema} from "mongoose";
import jwt from   "jsonwebtoken"    // JWT is used to create a session-like authentication, storing user information in a signed token for maintaining login state across requests.

import bcrypt from "bcrypt"

const adminSchema = new Schema(
    {
        enroll: {
            type : String ,
            required : true ,
            unique : true ,
            lowerCase : true,
            trim : true,
            index : true
        },
        email : {
            type : String ,
            required : true ,
            unique : true ,
            lowerCase : true,
            trim : true,
        },
        fullName: {
            type : String ,
            required : true ,
            trim : true,
            index : true
        },
        avatar : {
            type : String, //cloudnary url
            required : false
        },
        password: {
            type : String,
            required : [true , "password is require"] // custom error message
        },
        refreshToken :{
            type : String
        }
    },{
        timestamps : true
    }
)

adminSchema.pre("save" , async function(next){
    if(!this.isModified("password")) return next ();
    this.password = await bcrypt.hash(this.password , 10)
    next()
})  // pre is middleware. donot use arrow function because they donot have acess to "this." pre should know on which context we r talking. userSchema is like class ,  encryption take time so we use async

// injecting method to user schema to check password during authenticity
adminSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password , this.password)
}


adminSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id : this._id,
            email : this.email,
            enroll : this.enroll,
            fullName : this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}


adminSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id : this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}



export const Admin = mongoose.model("Admin" , adminSchema)