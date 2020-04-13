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
                mEmail: member.mEmail,
                fID: member.fID,
                mAvatar: {
                    image: member.mAvatar.image,
                    color: member.mAvatar.color
                }
            }

            const users = await addUser(user);

            let usersActive = [];
            for (let i = 0; i < users.length; i++) {
                if (users[i].fID === user.fID && users[i].mEmail !== user.mEmail) {
                    let messages = [];
                    let result = await getChatSingle({ "mEmailUser1": user.mEmail, "mEmailUser2": users[i].mEmail });
                    if (result) {
                        messages = result.messages;
                    }
                    const userActive = {...user, messages}
                    const userActiveTemp = {...users[i], messages};
                    usersActive = [...usersActive, userActiveTemp]

                    //emit user mới tới các user còn lại
                    io.to(users[i].mSocketID).emit("server-send-user-active", userActive);
                }
            }

            //emit toàn bộ user hiện có tới user mới
            socket.emit("server-send-list-user-active", usersActive);

            const usersRecent = await getUsersRecent(user.mEmail);

            //emit toàn bộ user recent tới user mới
            socket.emit("server-response-list-user-recent", usersRecent);

            await addMemberChatGroup(member);

            //emit family group to client
            const familyGroup = await getFamilyGroup(member.fID);
            socket.emit("server-send-family-group", familyGroup);

        });

        socket.on("client-send-message", async (data) => {

            const { receiver, sender, message } = data;

            const user1 = {
                mName: sender.mName,
                mEmail: sender.mEmail,
                mAvatar: {
                    image: sender.mAvatar.image,
                    color: sender.mAvatar.color
                },
                fID: sender.fID
            }

            const user2 = {
                mName: receiver.mName,
                mEmail: receiver.mEmail,
                mAvatar: {
                    image: receiver.mAvatar.image,
                    color: receiver.mAvatar.color
                },
                fID: receiver.fID
            }

            await addChatSingle(user1, user2, message);

            const chatSingle = await getLastMessage({ "mEmailUser1": sender.mEmail, "mEmailUser2": receiver.mEmail });
            const { messages } = chatSingle;

            io.to(receiver.mSocketID).emit("server-response-message-chat-single", { "partner": sender, "lastMessage": messages[0] });

        });

        socket.on("client-send-message-to-chat-group", async ({ member, message }) => {
            await addMessageChatGroup(member, message);
            io.to(member.fID).emit("server-response-messages-chat-group", message);
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

        socket.on("message-has-seen", async ({ user, partner, message }) => {
            const result = await updateStateSeenMessage(user, partner, message);
            if (result) { 
                console.log("cập nhật tin nhắn đã xem");
                console.log(user)
                io.to(partner.mSocketID).emit("server-response-message-has-seen", { "partner": user, message });
            } else { 
                console.log("cập nhật tin nhắn đã xem thất bại")
            }
        });

        socket.on("leave-chat", async () => {
            const users = await removeUser(socket.id);
            if (users) {
                users.map(async (userItem) => {
                    io.to(userItem.mSocketID).emit("server-send-user-leave", {"mSocketID": socket.id});
                });
            }
        });

        socket.on("disconnect", async () => {

            const users = await removeUser(socket.id);
            if (users) {
                users.map(async (userItem) => {
                    io.to(userItem.mSocketID).emit("server-send-user-leave", {"mSocketID": socket.id});
                });
            }

        });
    });
}

module.exports = chatBySocket;