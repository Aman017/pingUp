import mongoose from "mongoose";

const connectDb = async ()=>{
    try {
        mongoose.connection.on('connected',()=>console.log("Database Connected"))
        await mongoose.connect(`${process.env.MONGOBD_URL}/pingup`)
    } catch (error) {
        console.log(error.message)
    }
}

export default connectDb