let users = [];

function addUser(user) {
    const findUser = users.find(userItem => userItem.mEmail === user.mEmail);
    if(!findUser) {
        users = [...users, user];
    }
    return users;
}

function getUsersActive({ mEmail, fID }) {
    const usersByfID = users.filter(userItem => ( userItem.fID === fID && userItem.mEmail !== mEmail ));
    return usersByfID;
}

const removeUser = (mSocketID) => {
    let i = 0;
    for (i = 0; i < users.length; i++) {
        if (users[i].mSocketID === mSocketID) {
            users.splice(i, 1);
        }
    }
    return users;
}

const allUsers = () => {
    console.log(users);
    return users;
}

module.exports = {
    users,
    addUser,
    allUsers,
    removeUser,
    getUsersActive
}