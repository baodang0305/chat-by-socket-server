const mongoose = require("mongoose");

const { allUsers } = require("./user");

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
        seen: Boolean,
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
        chat = await chatSingleModel.create({user1, user2, messages: [{"name": user1.mName, "avatar": {"image": user1.mAvatar.image, "color": user1.mAvatar.color }, "message": message, "seen": false}]});
    } else if (result === "user1") {
        chat = await chatSingleModel.findOneAndUpdate({"user1.mEmail": user1.mEmail, "user2.mEmail": user2.mEmail}, {$push: {"messages": {"name": user1.mName, "avatar": {"image": user1.mAvatar.image, "color": user1.mAvatar.color}, "message": message, "seen": false} }} )
    } else {
        chat = await chatSingleModel.findOneAndUpdate({"user1.mEmail": user2.mEmail, "user2.mEmail": user1.mEmail}, {$push: {"messages": {"name": user1.mName, "avatar": {"image": user1.mAvatar.image, "color": user1.mAvatar.color}, "message": message, "seen": false} }} )
    }
    return chat;
} 

const getChatSingle = async ({mEmailUser1, mEmailUser2}) => {
    let chat = await chatSingleModel.findOne({"user1.mEmail": mEmailUser1, "user2.mEmail": mEmailUser2}, { messages: { $slice: -20 }} );
    if (!chat) {
        chat = await chatSingleModel.findOne({"user1.mEmail": mEmailUser2, "user2.mEmail": mEmailUser1}, { messages: { $slice: -20 }} );
    }
    return chat;
}

const getLastMessage = async ({mEmailUser1, mEmailUser2}) => {
    let chat = await chatSingleModel.findOne({"user1.mEmail": mEmailUser1, "user2.mEmail": mEmailUser2}, { messages: { $slice: -1 }} );
    if (!chat) {
        chat = await chatSingleModel.findOne({"user1.mEmail": mEmailUser2, "user2.mEmail": mEmailUser1}, { messages: { $slice: -1 }} );
    }
    return chat;
}

const getUsersRecent = async (mEmail) => {
    let list = [];
    let i = 0;
    let j = 0;

    const list1 = await chatSingleModel.find({"user1.mEmail": mEmail}, { messages: { $slice: -20 }} );
    const list2 = await chatSingleModel.find({"user2.mEmail": mEmail}, { messages: { $slice: -20 }} );

    let lengthList1 = list1.length;
    let lengthList2 = list2.length;

    let temp;
    let messages;

    while (i < lengthList1 && j < lengthList2) {

        temp = list1[i].user2;
        messages = list1[i].messages;
        temp = {...temp, messages}

        list = [...list, temp ]; i++;

        temp = list2[j].user1;
        messages = list2[j].messages;
        temp = {...temp, messages};

        list = [...list, temp ]; j++;
    }

    while (i < lengthList1) {
        temp = list1[i].user2;
        messages = list1[i].messages;
        temp = {...temp, messages}

        list = [...list, temp ]; i++;
    }

    while (j < lengthList2) {
        let temp = list2[j].user1;
        let messages = list2[j].messages;
        temp = {...temp, messages};

        list = [...list, temp ]; j++;
    }

    let mSocketID;
    const users = allUsers();
    const result = list.map(item => {
        mSocketID = ""
        for (let i = 0; i < users.length; i++) {
            if (item.mEmail === users[i].mEmail) {
               
                mSocketID = users[i].mSocketID
            }
        }
        return ({ ...item, ["mSocketID"]: mSocketID });
    });
    return result;
}

const updateStateSeenMessage = async(user, partner, message) => {
    
    let checkAndUpdate = await chatSingleModel.findOneAndUpdate({"user1.mEmail": user.mEmail, "user2.mEmail": partner.mEmail, "messages._id": message._id}, {"$set": { "messages.$.seen": true }})
    if (!checkAndUpdate) {
        checkAndUpdate = await chatSingleModel.findOneAndUpdate({"user1.mEmail": partner.mEmail, "user2.mEmail": user.mEmail, "messages._id": message._id}, {"$set": { "messages.$.seen": true }})
    }
    return checkAndUpdate;
}

module.exports = {
    addChatSingle,
    getChatSingle,
    getUsersRecent,
    getLastMessage,
    chatSingleModel,
    updateStateSeenMessage
}