let users = [];

function addUser(user) {
    const findUser = users.find(userItem => userItem.mEmail === user.mEmail);
    if(!findUser) {
        users.push(user);
    }
}

function getUsersActive({ mEmail, fID }) {
    const usersByfID = users.filter(userItem => ( userItem.fID === fID && userItem.mEmail !== mEmail ));
    return usersByfID;
}

const removeUser = (mSocketID) => {
    let i = 0;
    let user;
    for (i = 0; i < users.length; i++) {
        if (users[i].mSocketID === mSocketID) {
            user = users[i];
            users.splice(i, 1);
        }
    }
    return user;
}

module.exports = {
    users,
    addUser,
    getUsersActive,
    removeUser
}