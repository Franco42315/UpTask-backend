import mongoose, { Types, Document, Schema } from "mongoose";

export interface INote extends Document {
  content: string;
  createdBy: Types.ObjectId;
  task: Types.ObjectId;
}

const NoteSquema: Schema = new Schema({
  content: {
    type: String,
    req: true,
  },
  createdBy: {
    type: Types.ObjectId,
    ref: 'User',
    require: true
  },
  task: {
    type: Types.ObjectId,
    ref: 'Task',
    require: true
  }
}, {timestamps: true});

const Note = mongoose.model<INote>("Note", NoteSquema);
export default Note;
