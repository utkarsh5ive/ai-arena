import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IChat extends Document {
    userId: Types.ObjectId
    question: string
    result: Record<string, unknown>
    createdAt: Date
}

const ChatSchema = new Schema<IChat>({
    userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
    question: { type: String, required: true },
    result:   { type: Schema.Types.Mixed, required: true },
    createdAt: { type: Date, default: Date.now }
})

const Chat = mongoose.model<IChat>('Chat', ChatSchema)
export default Chat
