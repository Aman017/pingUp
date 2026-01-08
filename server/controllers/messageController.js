
import imagekit from '../configs/imagekit.js';
import Message from '../models/Message.js';
 

//Create an empty object to store server side Event connections
 
const connections = {};

export const sseController = (req, res) => {
  const { userId } = req.params;
  console.log("new client connected:", userId);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (res.flushHeaders) res.flushHeaders();

  connections[userId] = res;

  res.write(`event: connected\ndata: Connected to SSE stream\n\n`);

  const keepAlive = setInterval(() => {
    res.write(`event: keep-alive\n\n`);
  }, 15000);

  const cleanup = () => {
    clearInterval(keepAlive);
    delete connections[userId];
    console.log("client disconnected:", userId);
  };

  req.on("close", cleanup);
  req.on("end", cleanup);
};

// send message
export const sendMessage = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { to_user_id, text } = req.body;
        const image = req.file;

        let media_url = '';
        let message_type = image ? 'image' : 'text';

        if (image) {
            const response = await imagekit.upload({
                file: image.buffer, // ✅ FIXED
                fileName: image.originalname,
                folder: 'messages',
            });

            media_url = imagekit.url({
                path: response.filePath,
                transformation: [
                    { quality: 'auto' },
                    { format: 'webp' },
                    { width: '1280' },
                ],
            });
        }

        const message = await Message.create({
            from_user_id: userId,
            to_user_id,
            text,
            message_type,
            media_url,
        });

        res.json({ success: true, message });

        // Send message via SSE
        const messageWithUserData = await Message
            .findById(message._id)
            .populate('from_user_id');

        if (connections[to_user_id]) {
            connections[to_user_id].write(
                `data: ${JSON.stringify(messageWithUserData)}\n\n`
            );
        }

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

//get chat massages
export const getChatMessages = async (req,res)=>{
try {
    const {userId} = req.auth()
    const {to_user_id} = req.body;

    const messages = await Message.find({
        $or:[
            {from_user_id: userId, to_user_id},
            {from_user_id: to_user_id, to_user_id: userId},

        ]
    }).sort({created_at: -1})

    //mark messages as seen
    await Message.updateMany({from_user_id:to_user_id, to_user_id: userId},{seen: true})
    res.json({ success: true, messages });
} catch (error) {
     console.log(error);
        res.json({ success: false, message: error.message });
    
}
}
export const getUserRecentMessages = async(req,res)=>{
    try {
        const {userId} = req.auth();
        const messages = await Message.find({to_user_id: userId}).populate('from_user_id to_user_id').sort({created_at: -1});
        res.json({ success: true, messages });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}