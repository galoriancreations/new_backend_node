const { BGIMagic, SDGMagic, KidsMagic, MoralMagic, UnIMagic, Environmagic, Imagic  } = require("../models/question");
const BGIMagicJSON = require('../mock/Environmagic.json');
// const exist = await BGIMagic.find({})
// if(!exist){
//     const getQuestions = require('../mock/BGIMagic.json');
//     const result = await BGIMagic.insertMany(getQuestions)
//     console.log(result);
// }
// exist = await SDGMagic.find({})
// if(!exist){
//     const getQuestions = require('../mock/SDGMagic.json');
//     const result = SDGMagic.insertMany(getQuestions)
//     console.log(result);
// }
// exist = await Environmagic.find({})
// if(!exist){
//     const getQuestions = require('../mock/Environmagic.json');
//     const result = Environmagic.insertMany(getQuestions)
//     console.log(result);
// }
// exist = await Imagic.find({})
// if(!exist){
//     const getQuestions = require('../mock/Imagic.json');
//     const result = Imagic.insertMany(getQuestions)
//     console.log(result);
// }
// exist = await MoralMagic.find({})
// if(!exist){
//     const getQuestions = require('../mock/MoralMagic.json');
//     const result = MoralMagic.insertMany(getQuestions)
//     console.log(result);
// }
// exist = await UnIMagic.find({})
// if(!exist){
//     const getQuestions = require('../mock/UnIMagic.json');
//     const result = UnIMagic.insertMany(getQuestions)
//     console.log(result);
// }
// // exist = await KidsMagic.find({})
// if(!exist){
// //     const getQuestions = require('../mock/KidsMagic.json');
// //     const result = KidsMagic.insertMany(getQuestions)
//     // console.log(result);
// }


exports.getQuestion = async (req, res) => {
    try {
        let result;
        let i;
        const { challenge } = req.body;

        switch (challenge) {
            case "BGI-mAGIc":
                i = Math.floor(Math.random() * 18 + 1);
                result = await BGIMagic.findOne({ qnum: i });
                break;
            case "Environmagic":
                // await Environmagic.insertMany(BGIMagicJSON);
                i = Math.floor(Math.random() * 18 + 1);
                result = await Environmagic.findOne({ qnum: i });
                break;
            case "Imagic":
                result = await Imagic.findOne({ qnum: i });
                break;
            case "Kids-Magic":
                result = await KidsMagic.findOne({ qnum: i });
                break;
            case "Moral-Magic":
                result = await MoralMagic.findOne({ qnum: i });
                break;
            case "YouAndI-Magic":
                result = await UnIMagic.findOne({ qnum: i });
                break;
            default:
                return res.status(400).json({ msg: "Invalid challenge" });
        }

        return res.status(200).json({ result });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ msg: "Server error" });
    }
};


exports.updateAnswer = async (req, res) => {
    try {
        const { qnum, question, answer } = req.body;
        const answers = {
            id: qnum,
            text: answer,
            likes: 0
        };
        let result;

        const models = [BGIMagic, Environmagic, Imagic, KidsMagic, MoralMagic, UnIMagic];

        for (let i = 0; i < models.length; i++) 
        {
            const model = models[i];
            result = await model.findOneAndUpdate(
                { qnum: question },
                { $push: { answers: answers } },
                { new: true }
            );
            if (result) {
                break; // Stop looping if the answer is added to a model
            }
        }

        if (!result) {
            return res.status(404).json({ msg: "Question not found" });
        }

        return res.status(200).json({ result });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ msg: "Server error" });
    }
};

exports.updateLikes = async (req, res) => {
    try {
        const { id, likes } = req.body;
        let result;

        const models = [BGIMagic, Environmagic, Imagic, KidsMagic, MoralMagic, UnIMagic];

        for (let i = 0; i < models.length; i++) {
            const model = models[i];
            console.log(model)
            result = await Environmagic.findOneAndUpdate(
                { "answers._id": id },
                { $set: { "answers.$.likes": likes } },
                { new: true }
            );
            if (result) {
                break; // Stop looping if the likes are updated in a model
            }
        }

        if (!result) {
            return res.status(404).json({ msg: "Answer not found" });
        }

        return res.status(200).json({ result });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ msg: "Server error" });
    }
};
