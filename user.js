let users = [];

function addUser(user) {
    const findUser = users.find(userItem => userItem.mID === user.mID);
    if (!findUser) {
        users = [...users, user];
    }
    return users;
}

const removeUser = (mSocketID) => {
    const indexRemove = users.findIndex(element => element.mSocketID === mSocketID);
    if (indexRemove !== -1) {
        users.splice(indexRemove, 1);
    }
    return users;
}

const getUserBySocketID = (mSocketID) => {
    const indexUser = users.findIndex(element => element.mSocketID === mSocketID);
    if (indexUser !== -1) {
        return users[indexUser];
    }
    return null;
}

const allUsers = () => {
    return users;
}

module.exports = {
    addUser,
    allUsers,
    removeUser,
    getUserBySocketID
}