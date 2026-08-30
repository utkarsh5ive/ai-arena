import mongoose, { Document, Schema } from 'mongoose'

export interface IUser extends Document {
    username: string
    email: string
    passwordHash: string
    createdAt: Date
}

const UserSchema = new Schema<IUser>({
    username: { type: String, required: true, unique: true, trim: true },
    email:    { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
})

const User = mongoose.model<IUser>('User', UserSchema)
export default User
