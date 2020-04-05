const { addUser, getUsersActive, removeUser } = require("./user");
const { addChatSingle, getChatSingle, getUsersRecent } = require("./chatSingle"); 
const { addMemberChatGroup, getFamilyGroup, addMessageChatGroup } = require("./chatGroup");

const chatBySocket = (io) => {
    io.on("connection", socket => {

        console.log("New client connected");

        socket.on("join", async (member) => {
            const user = {
                mSocketID: socket.id, 
                mName: member.mName, 
                mEmail: member.mEmail, 
                fID: member.fID,
                mAvatar: member.mAvatar
            }

            addUser(user);

            addMemberChatGroup(member);

            socket.join(member.fID);

            const usersActive = await getUsersActive(member.fID);
            io.sockets.in(member.fID).emit("server-send-list-user-active", usersActive);

        });

        socket.on("client-request-content-messages", async ({ receiver, sender }) => {
            const chatSingle = await getChatSingle({"mEmailUser1": receiver.mEmail, "mEmailUser2": sender.mEmail});

            if(chatSingle) {
               const { messages } = chatSingle;
               socket.emit("server-response-messages-chat-single", { "user": receiver, messages });
            } else {
                socket.emit("server-response-messages-chat-single", { "user": receiver, "messages": null });
            }
            
        });

        socket.on("client-send-message", async (data) => {

            const { receiver, sender, message } = data;

            const user1 = {
                mName: sender.mName,
                mEmail: sender.mEmail,
                mAvatar: sender.mAvatar,
                fID: sender.fID
            }

            const user2 = {
                mName: receiver.mName,
                mEmail: receiver.mEmail,
                mAvatar: receiver.mAvatar,
                fID: receiver.fID
            }

            await addChatSingle(user1, user2, message);

            const chatSingle = await getChatSingle({"mEmailUser1": sender.mEmail, "mEmailUser2": receiver.mEmail});
            const { messages } = chatSingle; 

            io.to(receiver.mSocketID).emit("server-response-messages-chat-single", { "user": sender, messages });
            socket.emit("server-response-messages-chat-single", { "user": receiver, messages });

        });

        socket.on("client-send-message-to-chat-group", async ({member, message}) => {
            await addMessageChatGroup(member, message);

            const chatGroup = await getFamilyGroup(member.fID);
            const { messages } = chatGroup;
            io.to(member.fID).emit("server-response-messages-chat-group", messages);
        });

        socket.on("client-request-send-list-user-active", async (fID) => {
            const usersActive = await getUsersActive(fID);
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

        socket.on("disconnect", async() => {

            const user = await removeUser(socket.id);
            if (user) {
                const usersActive = await getUsersActive(user.fID);
                io.sockets.in(user.fID).emit("server-send-list-user-active", usersActive);
            }
    
        });
    });
}

module.exports = chatBySocket;