const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const chatGroupSchema = new Schema({
    fName: String,
    fID: String,
    fAvatar: String,
    members: [{
        mName: String,
        mEmail: String,
        mAvatar: String
    }],
    messages: [{
        name: String,
        avatar: String,
        message: String
    }]
}, { collection: "chats-group" });

const chatGroupModel = mongoose.model("chatGroupModel", chatGroupSchema);

const checkGroupExist = async (fID) => {
    const check = await chatGroupModel.findOne({fID});
    return check;
}

const checkMemberExist = async (fID, mEmail) => {
    const check = await chatGroupModel.findOne({"fID": fID}, {"members": {$elemMatch: {"mEmail": mEmail}}} );
    return check.members.length;
}

const addMemberChatGroup = async (member) => {
    let result = null;
    const checkGroup = await checkGroupExist(member.fID);
    if (checkGroup) {
        const lengthMembers = await checkMemberExist(member.fID, member.mEmail);
        if (lengthMembers === 0) {
            result = await chatGroupModel.findOneAndUpdate({"fID": member.fID}, {$push: 
                                                           {"members": {"mName": member.mName, "mAvatar": member.mAvatar, "mEmail": member.mEmail}}});
        }
    } else {
        const chatGroup = {
            fID: member.fID,
            fName: member.fName,
            fImage: member.fImage,
            members: [{
                mName: member.mName,
                mAvatar: member.mAvatar,
                mEmail: member.mEmail
            }]
        }
        result = await chatGroupModel.create(chatGroup);
    }
    return result;
}

const addMessageChatGroup = async (member, message) => {
    
    const result = await chatGroupModel.findOneAndUpdate({"fID": member.fID},
    {$push: {"messages": {"name": member.mName, "avatar": member.mAvatar, "message": message}}});
       
    return result;
}

const getFamilyGroup = async (fID) => {
    const familyGroup = await chatGroupModel.findOne({fID});
    return familyGroup;
}

module.exports = {
    addMemberChatGroup,
    addMessageChatGroup,
    getFamilyGroup
}