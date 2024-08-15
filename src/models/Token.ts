import mongoose, { Schema, Document, Types } from "mongoose";

export interface IToken extends Document {
  token: string,
  user: Types.ObjectId,
  createdAt: Date
}

const tokenSchema = new Schema({
  token: {
    type: String,
    required: true
  },
  user: {
    type: Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Agregar un índice para que expire después de 30 segundos
tokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 });

const Token = mongoose.model<IToken>('Token', tokenSchema);
export default Token;
