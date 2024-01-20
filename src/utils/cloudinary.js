import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY , 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath)=>{
    try {
        if(!localFilePath) return null
        //upload fill on coludinary
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        // file has been uploded sucessfull
        
        //console.log("fill is uploaded on cloudinary at",response.url);
        //console.log(response);

        fs.unlinkSync(localFilePath);
        
        return response

    } catch (err) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary fill as the upload operation got faild
        return null
    }
}

export {uploadOnCloudinary}
          
