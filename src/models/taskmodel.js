import mongoose from "mongoose";
const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    status: {
        type: String,
        enum: ["todo", "in-progress", "done"],
        default: "todo",
    },
    priority: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "low",
    },
    dueDate: {
      type: Date,
      required: true,
    },
    assignedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    createdBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }],
    attachments: [{
        url: String,
    }],
    todochecklists: [todoSchema],
    progress: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

export const Task = mongoose.model("Task", taskSchema);
