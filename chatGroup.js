const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const chatGroupSchema = new Schema({

    fID: String,
    fName: String,
    fImage: String,
    members: [{
        mName: String,
        mID: String,
        mAvatar: { image: String, color: String }
    }],
    messages: [{
        id: String,
        name: String,
        message: String,
        avatar: { image: String, color: String }
    }]

}, { collection: "chats-group" });

const chatGroupModel = mongoose.model("chatGroupModel", chatGroupSchema);

const checkGroupExist = async (fID) => {

    const check = await chatGroupModel.findOne({fID});
    return check;

}

const checkMemberExist = async (fID, mID) => {

    const check = await chatGroupModel.findOne({"fID": fID}, {"members": {$elemMatch: {"mID": mID}}} );
    return check.members.length;

}

const addMemberChatGroup = async (member) => {

    let result = null;
    const checkGroup = await checkGroupExist(member.fID);

    if (checkGroup) {

        const lengthMembers = await checkMemberExist(member.fID, member.mID);

        if (lengthMembers === 0) {

            result = await chatGroupModel.findOneAndUpdate(
                {
                    "fID": member.fID
                }, {
                    $push: 
                    {
                        "members": 
                            {
                                "mID": member.mID,
                                "mName": member.mName,
                                "mAvatar": {"image": member.mAvatar.image, "color": member.mAvatar.color } 
                            }
                    }
                }
            );

        }

    } else {

        const chatGroup = {

            "fID": member.fID,
            "fName": member.fName,
            "fImage": member.fImage,
            "members": [{
                "mID": member.mID,
                "mName": member.mName,
                "mAvatar": { "image": member.mAvatar.image, "color": member.mAvatar.color }
            }]

        }
        
        result = await chatGroupModel.create(chatGroup);

    }

    return result;

}

const addMessageChatGroup = async (member, messageContainer) => {
    
    const result = await chatGroupModel.findOneAndUpdate({ "fID": member.fID }, { $push: { "messages": messageContainer } });
    return result;

}

const getFamilyGroup = async (fID) => {

    const familyGroup = await chatGroupModel.findOne({fID}, { messages: { $slice: -20 }} );
    return familyGroup;

}

module.exports = {

    getFamilyGroup,
    addMemberChatGroup,
    addMessageChatGroup

}