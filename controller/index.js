const { chatSingleModel } = require("../chatSingle");

exports.getNumberOfIncomingMessages = async (req, res) => {
    const { user } = req.body;

    const list1 = await chatSingleModel.find({ "user1.mEmail": user.mEmail }, { messages: { $slice: -1 } });
    const list2 = await chatSingleModel.find({ "user2.mEmail": user.mEmail }, { messages: { $slice: -1 } });

    let number = 0;
    if (list1) {
        for (let i = 0; i < list1.length; i++) {
            if (list1[i].messages[list1[i].messages.length - 1].seen === false && list1[i].messages[list1[i].messages.length - 1].name !== user.mName) {
                number++;
            }
        }
    }

    if (list2) {
        for (let j = 0; j < list2.length; j++) {
            if (list2[j].messages[list2[j].messages.length - 1].seen === false && list2[j].messages[list2[j].messages.length - 1].name !== user.mName) {
                number++;
            }
        }
    }

    return res.send({ number });
}