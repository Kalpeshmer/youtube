import { asyncHandler } from "../utils/asyncHandler.js";
import {apiError} from "../utils/apiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/apiResponse.js";

const registerUser = asyncHandler( async(req,res)=>{
    // get user details from fronted
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudenary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    const {username, email, fullname, password} = req.body;

    // if(fullname === ""){
    //     throw new apiError(400,"fullName is Empaty")
    // }
    if(
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ){
        throw new apiError(400,"ALL fields are required")
    }

    const existedUser = await User.findOne({
        $or:[{ username }, { email }]
    })

    if(existedUser){
        throw new apiError(409,"user with email or username already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path; // check req.files
    const coverImageLocalPath =  req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new apiError(400,"avatar image requied")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new apiError(400,"avatar file is required")
    }

    const user = await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        username:username.toLowerCase(),
        email,
        password
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshTocken"
    )

    if(!createdUser){
        throw new apiError(500,"somethng went wrong while databse insertion")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "user created sucessfully")
    )

} )

export {
    registerUser,
}