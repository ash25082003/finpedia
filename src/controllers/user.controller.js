import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from '../utils/ApiError.js'
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse}    from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose";





const generateAcessandRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})



        return {accessToken , refreshToken}

    } catch (error) {
        throw new ApiError(500 , "something went wrong while generating refresh and acess token")
    }
}



// const registerUser = asyncHandler(async(req , res , next)=>{
//     // get user detail from frontend
//     // validation - not empty
//     // check if user already exist : enroll , email
//     //check for image , check for avatar
//     //upload them to cloudinary
//     //create user object - create entry in db
//     //remove password and refrsh token field from response
//     //check for user creation
//     //return res

//     const{fullName , email , enroll , password} = req.body
//     //console.log("email :" , email);

//     // if(fullName === ""){
//     //     throw new ApiError(400 , "fullname is required" )
//     // }

//     if (
//         [fullName , email , enroll , password].some((field)=>
//         field?.trim() === "")
//     ) {
//         throw new ApiError(400 , "All fields are required")
//     } 

//     const existingUser = await User.findOne({
//         $or :[{enroll } , {email}]           // finding in database if any one match

//     })
//     console.log("1" , existingUser)
//     if(existingUser){
//         throw new ApiError(409 , "User with email or enroll already exist")
//     }

    
    


    


    

//     const user = await  User.create({
//         fullName,
       
        
//         email,
//         enroll : enroll,
//         password ,

//     })
//     const createdUser = await User.findById(user._id).select(
//         "-password -refreshToken"      // use to select all exect field name password and refreshToken
//     )

//     if(!createdUser){
//         throw new ApiError(500 , "Something Went wrong while registering the user")
//     }


//     loginUser();


//     res.status(201).json(
//         new ApiResponse(200 , createdUser , "User register Sucessfully")
//     )
// })

const registerUser = asyncHandler(async(req , res , next)=>{
    const { fullName, email, enroll, password } = req.body;
    console.log(req.body)

    if (
        [fullName, email, enroll, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400 , "All fields are required");
    } 

    const existingUser = await User.findOne({
        $or: [{ enroll }, { email }]
    });

    if(existingUser){
        throw new ApiError(409 , "User with email or enroll already exists");
    }

    const user = await User.create({
        fullName,
        email,
        enroll,
        password,
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if(!createdUser){
        throw new ApiError(500 , "Something went wrong while registering the user");
    }

    // Login the user after successful registration
    const { accessToken, refreshToken } = await generateAcessandRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    };

    // Send cookies and response
    return res.status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User registered and logged in successfully"
            )
        );
});


const loginUser = asyncHandler(async(req , res, next)=>{
    // req body-> data
    // enroll or email
    // find the user
    // password check
    // acess and refresh token
    // send cookies

    const {email , enroll , password} = req.body;

    console.log(req.body)

    if(!(enroll || email)){
        throw new ApiError(400 , "usename or email is requires")
    }
    

    const user = await User.findOne({
        $or : [{enroll} , {email}]
    })

    if(!user){
        throw new ApiError(404 , "user does not exist")
    }

    // for using a method we created in usermodel we need to apply on instance of User. 
    //Here we have created or accesed the one instance of User as user
    // user.model User is class of mongodb and we have acessed on instance of User i.e user

    const  isPasswordValid = await user.isPasswordCorrect(password)
    
    
    if(!isPasswordValid){
        throw new ApiError(401 , "Invalid password")
    }
    const {accessToken , refreshToken } = await generateAcessandRefreshTokens(user._id)
    


    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly : true,
        secure : true
    }

    return res.status(200)
    .cookie("accessToken" , accessToken , options)
    .cookie("refreshToken" , refreshToken , options)
    .json(
        new ApiResponse(
            200,
            {
                user : loggedInUser , accessToken,
                refreshToken
            },
            "userlogin sucessfully"
        )
    )

})


const logoutUser = asyncHandler(async(req , res )=>{
    
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken : undefined
            }
        },{
            new : true
        }
    )
    const options = {
        httpOnly : true,
        secure : true
    }
    return res.status(200)
    .clearCookie("accessToken" , options)
    .clearCookie("refreshToken" , options)
    .json(new ApiResponse(200 , {} , "User logged Out"))
})

// we will use try catch under function also because at some operations we are not throwing if something bad happen
// so we need to keep in try catch to avoid any error

const refreshAccessToken = asyncHandler(async(req , res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401 , "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken._id)
    
        if(!user){
            throw new ApiError(401 , "invalid refresh token")
        }
    
        if(incomingRefreshToken !== user.refreshToken){
            throw new ApiError(401 , "Refresh token is expired or used")
        }
    
        const options ={
            httpOnly : true ,
            secure : true
        }
        const {accessToken , newrefreshToken} = await generateAcessandRefreshTokens(user._id)
    
        return res.status(200)
        .cookie("acessToken" , accessToken , options)
        .cookie("refreshToken" , newrefreshToken , options)
        .json(
            new ApiResponse(
                200,
                {accessToken , refreshToken : newrefreshToken},
                "Accessed token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401 , error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler(async(req , res)=>{

    const {oldPassword , newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400 , "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave : false})

    return res
    .status(200)
    .json(new ApiResponse(200 ,{}, "password changed Successfull"))
})

const getCurrentUser = asyncHandler(async(req , res)=>{

    return res.status(200).json(new ApiResponse(200 , req.user , "current user fetched"))
})

const updateAccountDetails = asyncHandler(async(req , res)=>{
    const {fullName , email} = req.body
    console.log(req.body)

    if(!fullName || !email){
        throw new ApiError(400 , "All fields are required")
    }

    const user = await User.findByIdAndUpdate(req.user?._id ,
    {
        $set : {
            fullName : fullName,
            email : email
        }

    } , 
    {new : true} ).select("-password")// new:true give us updated version of info


    return res.status(200).json(
        new ApiResponse(200 , user , "Account details updated sucessfully")
    )
})

const updateUserAvatar = asyncHandler(async(req , res) =>{

    // we have to take one file so we will use "file" instead of "files"

    const avatarLocalPath = req.file?.path
    
    if(!avatarLocalPath){
        throw new ApiError(400 , "Avatar file is missing")
    }

     //Todo : Delete image from cloudnary after update of image 
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400 , "Error while uploading on avatar")
    }
    const user = await User.findByIdAndUpdate(req.user?._id , 
        {
            $set : {avatar : avatar.url}
        },
        {
            new : true

    }).select("-password")

    return res.status(200).json(
        new ApiResponse(200 , user , "Avatar Updated sucessfully")
    )

})





const getUserProfile = asyncHandler(async(req , res)=>{

    const {enroll} = req.params

    if(!enroll?.trim()){
        throw new ApiError(400 , "enroll is missing")
    }

    const user = await User.aggregate([
        {
            $match : {
                enroll : enroll
            }

        },
        {
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "channel",
                as : "subscribers"
            }

        },
        {
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "subscriber",
                as : "subscribedTo"
            }
        },
        {
            $addFields : {
                subscriberCount : {
                    $size : "$subscribers"
                },
                channelsSubscribedToCount : {
                    $size : "$subscribedTo"
                },
                isSubscribed : {
                        if : {$in : [req.user?._id , "$subscribers.subscriber"]},
                        then : true, 
                        else : false                    
                }
            }
        },
        {
            $project: {
                fullName : 1,
                enroll : 1,
                subscriberCount : 1,
                channelsSubscribedToCount : 1,
                isSubscribed : 1,
                avatar : 1,
                coverImage : 1 ,
                email : 1

            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404 , "channel does not exist")
    }

    return res
    .status(200)
    .json(new ApiResponse(200 , channel[0], "user channel fetched successfully"))

})

const getWatchHistory = asyncHandler(async(req , res)=> {
    const user = await User.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId(req.user._id)
            }
        },{
            $lookup : {
                from : "videos" ,
                localField : "watchHistory",
                foreignField :  "_id" ,
                as : "watchHistory",
                pipeline : [
                    {
                        $lookup : {
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as : "owner" ,
                            pipeline : [{
                                $project : {
                                    fullName : 1 ,
                                    enroll : 1 ,
                                    avatar : 1
                                }
                            }]
                        }
                    },
                    {
                        $addFields : {
                            owner : {
                                $first : "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200).json(
        new ApiResponse , 200 , user[0].watchHistory , "Watch history fetched sucesssfully"
    )
})
const getAllUserInfo = asyncHandler(async (req, res) => {
    const users = await User.find()
        .select("-password -refreshToken") // Exclude sensitive fields
        .populate({
            path: 'testHistory', // Populate testHistory
            populate: { // Populate testId within testHistory
                path: 'testId',
                model: 'Test' // Replace 'Test' with the actual name of the Test model
            }
        })
        .lean(); // Converts MongoDB documents to plain JavaScript objects for easier manipulation if needed

    if (!users || users.length === 0) {
        throw new ApiError(404, "No users found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            users,
            "All user information fetched successfully"
        )
    );
});




export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    getAllUserInfo,
    getUserProfile,
    getWatchHistory
}; 