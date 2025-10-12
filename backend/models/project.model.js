import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      required: true,
      unique: [true,"Project name already taken"],
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    users: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "user",
          required: true,
        },
      ],
      default: [],
     
    },
  },
  {
    timestamps: true,
  }
);

projectSchema.pre('save', function (next) {
  if (!this.users.includes(this.creator)) {
    this.users.push(this.creator);
  }
  next();
});


const Project = mongoose.model("project", projectSchema);

export default Project;
