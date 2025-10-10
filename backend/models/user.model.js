import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim:true,
        minlength:[5, "Email must be at least 5 characters"],
        lowercase:true,
        maxlength:[100, "Email must be at most 100 characters"]
    },
    password: {
        type: String,
        required: true,
        select:false,
        minlength:[8, "Password must be at least 8 characters"],
        maxlength:[30, "Password must be at most 30 characters"]
    }
}, {
    timestamps: true
});

userSchema.pre('save',async function(next) {
    const user = this;
    if(!user.isModified('password')) return next();

    // Hash the password before saving
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
});


userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
}

userSchema.methods.generateAuthToken = function() {
    const user = this;
    const token = jwt.sign({ _id: user._id, email: user.email },
                        process.env.JWT_SECRET,
                        { expiresIn: '24h' });
    return token;
}


const User = mongoose.model("user", userSchema);

export default User;
