import mongoose, {schema} from "mongoose";

const userSchema = new schema({
    avatar : {
        type:{
            url:String,
            localPath:String
        },
        default:{
            url:`https://placehold.co/200x200`,
            localPath:""
        }
    },
    username:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true
    },
    fullname:{
        type:String,
        trim:true
    },
    password:{
        type: String,
        required:[true,"Password is required"]
    },
    isEmailVerified:{
        type:Boolean,
        default:false
    },
    refreshToken:{
        type:String
    },
    forgotPasswordToken:{
        type:String
    },
    forgotPasswordExpiry:{
        type:Date
    },
    emailVerificationToken:{
        type:String
    },
    emailVerificationExpiry:{
        type:Date
    }
},{
    timestamps:true,
},
)



export const user = mongoose.model("User",userSchema);