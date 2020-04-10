const { addUser, getUsersActive, removeUser } = require("./user");
const { addChatSingle, getChatSingle, getUsersRecent } = require("./chatSingle"); 
const { addMemberChatGroup, getFamilyGroup, addMessageChatGroup } = require("./chatGroup");

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
            
            users.map(async (userItem) => {
                const usersActive = await getUsersActive({"mEmail": userItem.mEmail, "fID": userItem.fID});
                io.to(userItem.mSocketID).emit("server-send-list-user-active", usersActive);
            });

            const usersRecent = await getUsersRecent(user.mEmail);
            console.log(usersRecent)
            socket.emit("server-send-list-user-recent", usersRecent);

            await addMemberChatGroup(member);

        });

        socket.on("client-request-content-messages", async ({ receiver, sender }) => {
            const chatSingle = await getChatSingle({"mEmailUser1": receiver.mEmail, "mEmailUser2": sender.mEmail});
            if(chatSingle) {
               const { messages } = chatSingle;
               socket.emit("server-response-messages-chat-single", { "partner": receiver, messages });
            } else {
                socket.emit("server-response-messages-chat-single", { "partner": receiver, "messages": null });
            }
            
        });

        socket.on("client-request-content-messages-filtered", async ({ receiver, sender }) => {
            const chatSingle = await getChatSingle({"mEmailUser1": receiver.mEmail, "mEmailUser2": sender.mEmail});
            if(chatSingle) {
               const { messages } = chatSingle;
               socket.emit("server-response-messages-chat-single-filtered", { "partner": receiver, messages });
            } else {
                socket.emit("server-response-messages-chat-single-filtered", { "partner": receiver, "messages": null });
            }
            
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

            const chatSingle = await getChatSingle({"mEmailUser1": sender.mEmail, "mEmailUser2": receiver.mEmail});
            const { messages } = chatSingle; 
            io.to(receiver.mSocketID).emit("server-response-messages-chat-single", { "partner": sender, messages });
            socket.emit("server-response-messages-chat-single", { "partner": receiver, messages });

        });

        socket.on("client-send-message-to-chat-group", async ({member, message}) => {
            await addMessageChatGroup(member, message);

            const chatGroup = await getFamilyGroup(member.fID);
            const { messages } = chatGroup;
            io.to(member.fID).emit("server-response-messages-chat-group", messages);
        });

        socket.on("client-request-send-list-user-active", async ({ mEmail, fID }) => {
            const usersActive = await getUsersActive({ mEmail, fID });
            socket.emit("server-send-list-user-active", usersActive);
        });

        socket.on("client-request-send-list-user-recent", async (mEmail) => {
            const usersRecent = await getUsersRecent(mEmail);
            socket.emit("server-send-list-user-recent", usersRecent);
        });

        socket.on("client-request-send-family-group", async (fID) => {
            const familyGroup = await getFamilyGroup(fID);
            socket.emit("server-send-family-group", familyGroup);
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

        socket.on("leave-chat", async() => {
            const users = await removeUser(socket.id);

            if (users) {
                users.map(async (userItem) => {
                    const usersActive = await getUsersActive({"mEmail": userItem.mEmail, "fID": userItem.fID});
                    io.to(userItem.mSocketID).emit("server-send-list-user-active", usersActive);
                });
            }
        });

        socket.on("disconnect", async() => {

            const users = await removeUser(socket.id);

            if (users) {
                users.map(async (userItem) => {
                    const usersActive = await getUsersActive({"mEmail": userItem.mEmail, "fID": userItem.fID});
                    io.to(userItem.mSocketID).emit("server-send-list-user-active", usersActive);
                });
            }
    
        });
    });
}

module.exports = chatBySocket;