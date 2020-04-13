let users = [];

function addUser(user) {
    const findUser = users.find(userItem => userItem.mEmail === user.mEmail);
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

const allUsers = () => {
    return users;
}

module.exports = {
    addUser,
    allUsers,
    removeUser,
}