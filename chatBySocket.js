const { addUser, removeUser } = require("./user");
const { addMemberChatGroup, getFamilyGroup, addMessageChatGroup } = require("./chatGroup");
const { addChatSingle, getChatSingle, getUsersRecent, getLastMessage, updateStateSeenMessage } = require("./chatSingle");

const chatBySocket = (io) => {
    io.on("connection", socket => {

        console.log("New client connected");

        socket.on("join", async (member) => {

            socket.join(member.fID);

            const user = {
                mSocketID: socket.id,
                mName: member.mName,
                mID: member._id,
                fID: member.fID,
                mAvatar: {
                    image: member.mAvatar.image,
                    color: member.mAvatar.color
                }
            }

            const users = await addUser(user);

            let usersActive = [];
            for (let i = 0; i < users.length; i++) {
                if (users[i].fID === user.fID && users[i].mID !== user.mID) {
                    let messages = [];
                    let result = await getChatSingle({ "mIDUser1": user.mID, "mIDUser2": users[i].mID });
                    if (result) {
                        messages = result.messages;
                    }
                    const userActive = { ...user, messages }
                    const userActiveTemp = { ...users[i], messages };
                    usersActive = [...usersActive, userActiveTemp]

                    //emit user mới tới các user còn lại
                    io.to(users[i].mSocketID).emit("server-send-user-active", userActive);
                }
            }

            //emit toàn bộ user hiện có tới user mới
            socket.emit("server-send-list-user-active", usersActive);

            const usersRecent = await getUsersRecent(user.mID);

            //emit toàn bộ user recent tới user mới
            socket.emit("server-response-list-user-recent", usersRecent);

            await addMemberChatGroup(member);

            //emit family group to client
            const familyGroup = await getFamilyGroup(member.fID);
            socket.emit("server-send-family-group", familyGroup);

        });

        socket.on("client-send-message", async (data) => {

            const { receiver, sender, messageContainer } = data;

            const user1 = {
                "fID": sender.fID,
                "mID": sender.mID,
                "mName": sender.mName,
                "mAvatar": { "image": sender.mAvatar.image, "color": sender.mAvatar.color }
            }

            const user2 = {
                "fID": receiver.fID,
                "mID": receiver.mID,
                "mName": receiver.mName,
                "mAvatar": { "image": receiver.mAvatar.image, "color": receiver.mAvatar.color }
            }

            await addChatSingle(user1, user2, messageContainer);

            const chatSingle = await getLastMessage({ "mIDUser1": sender.mID, "mIDUser2": receiver.mID });
            const { messages } = chatSingle;
            io.to(receiver.mSocketID).emit("server-response-message-chat-single", { sender, "messageContainer": messages[0] });

        });

        socket.on("client-send-message-to-chat-group", async ({ member, messageContainer }) => {
            await addMessageChatGroup(member, messageContainer);
            io.to(member.fID).emit("server-response-messages-chat-group", messageContainer);
        });

        socket.on("client-notification-is-entering", ({ sender, receiver }) => {
            if (!receiver.fName) {
                io.to(receiver.mSocketID).emit("server-response-user-is-entering-to-partner", sender);
            } else {
                io.to(receiver.fID).emit("server-response-user-is-entering-to-group", sender);
            }
        });

        socket.on("client-notification-is-stoped-entering", ({ sender, receiver }) => {
            if (!receiver.fName) {
                io.to(receiver.mSocketID).emit("server-response-user-is-stoped-entering-to-partner", sender);
            } else {
                io.to(receiver.fID).emit("server-response-user-is-stoped-entering-to-group", sender);
            }
        });

        socket.on("message-has-seen", async ({ sender, receiver, messageContainer }) => {
            const result = await updateStateSeenMessage(sender, receiver, messageContainer);
            if (result) {
                console.log("cập nhật tin nhắn đã xem");
                io.to(receiver.mSocketID).emit("server-response-message-has-seen", { sender, messageContainer });
            } else {
                console.log("cập nhật tin nhắn đã xem thất bại")
            }
        });


        socket.on("offer", ({ mSocketID, offer }) => {
            io.to(mSocketID).emit("offer", { "mSocketID": socket.id, offer });
        });

        socket.on("answer", ({ mSocketID, answer }) => {
            io.to(mSocketID).emit("answer", { "mSocketID": socket.id, answer });
        });

        socket.on("candidate", ({ mSocketID, candidate }) => {
            io.to(mSocketID).emit("candidate", { "mSocketID": mSocketID, candidate });
        });


        socket.on("leave-chat", async () => {
            const users = await removeUser(socket.id);
            if (users) {
                users.map(async (userItem) => {
                    io.to(userItem.mSocketID).emit("server-send-user-leave", { "mSocketID": socket.id });
                });
            }
        });

        socket.on("disconnect", async () => {

            const users = await removeUser(socket.id);
            if (users) {
                users.map(async (userItem) => {
                    io.to(userItem.mSocketID).emit("server-send-user-leave", { "mSocketID": socket.id });
                });
            }

        });
    });
}

module.exports = chatBySocket;