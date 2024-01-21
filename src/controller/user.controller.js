import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
       
        const accessToken = user.generateAccessToken()       
        const refreshToken = user.generateRefreshToken()    
        
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false })
       
        return {accessToken, refreshToken} ;

    } catch (error) {
        throw new ApiError(500,"something went wrong while generating referesh and access token ")
    }
}

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

    const {userName, email, fullName, password} = req.body;
    console.log(userName);

    // if(fullname === ""){
    //     throw new apiError(400,"fullName is Empaty")
    // }
    if(
        [fullName, email, userName, password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400,"ALL fields are required")
    }

    const existedUser = await User.findOne({
        $or:[{ userName }, { email }]
    })

    if(existedUser){
        throw new ApiError(409,"user with email or username already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path; // check req.files
    // const coverImageLocalPath =  req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"avatar image requied")
    }

    console.log(avatarLocalPath);

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    console.log(avatar);

    if(!avatar){
        throw new ApiError(400,"avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        userName : userName.toLowerCase(),
        email,
        password
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshTocken"
    )

    if(!createdUser){
        throw new ApiError(500,"somethng went wrong while databse insertion")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "user created sucessfully")
    )

} )

const loginUser = asyncHandler(async (req,res) =>{
    // req body -> data
    // username or email
    // find the user
    // password check
    // access and referesh token
    // send cookie above token

    const{ userName, email, password } = req.body;

    if(!(userName || email)){
        throw new ApiError(404,"userName and email is required")
    }

    const user = await User.findOne({
        $or: [{userName}, {email}]
    })

    if( !user){
        throw new ApiError(404,"User dose not exist")
    }
    
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"Invaild user credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);

    const loggedInUser = await User.findById(user._id).
    select("-password -refreshToken")

    const options = {
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser, accessToken, refreshToken
            },
            "user logged in successfully"
            )
    )

})

const logoutUser = asyncHandler(async(req,res)=>{
    User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        },
        {
            new: true
        }
        
    )
    
    const options = {
        httpOnly:true,
        secure:true
    }
    
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200,{},"user logout sucessfully")
    )

})

const refreshAccessToken = asyncHandler(async(req,res)=>{

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401,"unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken
            ,process.env.REFRESH_TOKEN_SECRET
        ) // here we get all payload of jwt
    
        const user = await User.findById(decodedToken?._id);
    
        if(!user){
            throw new ApiError(401,"invaild refresh token")
        }
    
        if(incomingRefreshToken !== user.refreshToken){
            throw new ApiError(401,"Refresh Token used or expired")
        }
    
        const options = {
            httpOnly:true,
            secure:true
        }
    
        const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id);
    
        return res
        .status(200)
        .cookies("accessToken",accessToken,options)
        .cookies("refreshToken",refreshToken,options)
        .json(
           new ApiResponse(
               200,
               { accessToken, refreshToken, user },
               "RefreshToken refreshed sucessfully"
            )
         )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invaild refresh token")
    }
    

    
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
}