const mongoose = require("mongoose");

const { users } = require("./user");

const Schema = mongoose.Schema;

const chatSingleSchema = new Schema({
    user1: {
        mName: String,
        mEmail: String,
        mAvatar: {
            image: String,
            color: String
        },
        fID: String
    },
    user2: {
        mName: String,
        mEmail: String,
        mAvatar: {
            image: String,
            color: String
        },
        fID: String
    },
    messages: [{
        name: String,
        message: String,
        avatar: {
            image: String,
            color: String
        }
    }]
}, {collection: "chats-single"});

const chatSingleModel = mongoose.model("chatSingleModel", chatSingleSchema);

const checkChatExist = async (user1, user2) => {

    const chat1 = await chatSingleModel.findOne({"user1.mEmail": user1.mEmail, "user2.mEmail": user2.mEmail});

    if (chat1) { return "user1"; }

    const chat2 = await chatSingleModel.findOne({"user1.mEmail": user2.mEmail, "user2.mEmail": user1.mEmail});
    
    if (chat2) { return "user2"; }

    return false;
}

const addChatSingle = async (user1, user2, message) => {

    const result = await checkChatExist(user1, user2);

    let chat;
    if (result === false) {
        chat = await chatSingleModel.create({user1, user2, messages: [{"name": user1.mName, "avatar": {"image": user1.mAvatar.image, "color": user1.mAvatar.color }, "message": message}]});
    } else if (result === "user1") {
        chat = await chatSingleModel.findOneAndUpdate({"user1.mEmail": user1.mEmail, "user2.mEmail": user2.mEmail}, {$push: {"messages": {"name": user1.mName, "avatar": {"image": user1.mAvatar.image, "color": user1.mAvatar.color}, "message": message} }} )
    } else {
        chat = await chatSingleModel.findOneAndUpdate({"user1.mEmail": user2.mEmail, "user2.mEmail": user1.mEmail}, {$push: {"messages": {"name": user1.mName, "avatar": {"image": user1.mAvatar.image, "color": user1.mAvatar.color}, "message": message} }} )
    }
    return chat;
} 

const getChatSingle = async ({mEmailUser1, mEmailUser2}) => {
    let chat = await chatSingleModel.findOne({"user1.mEmail": mEmailUser1, "user2.mEmail": mEmailUser2}, { messages: { $slice: -40 }} );
    if (!chat) {
        chat = await chatSingleModel.findOne({"user1.mEmail": mEmailUser2, "user2.mEmail": mEmailUser1}, { messages: { $slice: -40 }} );
    }
    return chat;
}

const getUsersRecent = async (mEmail) => {
    let list = [];
    let i = 0;
    let j = 0;
    const list1 = await chatSingleModel.find({"user1.mEmail": mEmail});

    const list2 = await chatSingleModel.find({"user2.mEmail": mEmail});

    let lengthList1 = list1.length;
    let lengthList2 = list2.length;

    while (i < lengthList1 && j < lengthList2) {
        list = [...list, list1[i++].user2];
        list = [...list, list2[j++].user1];
    }
    while (i < lengthList1) {
        list = [...list, list1[i++].user2];
    }
    while (j < lengthList2) {
        list = [...list, list2[j++].user1];
    }

    let mSocketID;
    const result = list.map(item => {
        mSocketID = ""
        for (let i = 0; i < users.length; i++) {
            if (item.mEmail === users[i].mEmail) {
                mSocketID = users[i].mSocketID
            }
        }
        return ({...item,["mSocketID"]: mSocketID});
    });
  
    return result;
}

module.exports = {
    addChatSingle,
    getChatSingle,
    getUsersRecent
}