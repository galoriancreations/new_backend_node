const mongoose = require("mongoose")
const { BGIMagic, SDGMagic, KidsMagic, MoralMagic, UnIMagic, Environmagic, Imagic  } = require("../models/question");
// const BGIMagicJSON = require('../mock/UnIMagic.json');

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
        let j;
        const { challenge, qId } = req.body;
        console.log(req.body);
        const models = [BGIMagic, Environmagic, SDGMagic, Imagic, KidsMagic, UnIMagic, MoralMagic];

        for (let i = 0; i < models.length; i++) 
        {
            const model = models[i];
            console.log(model.modelName);
            if(model.modelName === challenge){
                if (qId) {
                    j = qId;
                }
                else{
                    if(challenge === "BGIMagic" || challenge === "SDGMagic" ){
                        j = Math.floor(Math.random() * 18 + 1);
                    }
                    else{
                        j = Math.floor(Math.random() * 20 + 1);
                    }
                }
                console.log("j =" + j );
                result = await model.findOne({ qnum: j });
            }
            if (result) {
                break;
            }
        }
        // console.log(result);
        return res.status(200).json({ result });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ msg: "Server error" });
    }
};


exports.updateAnswer = async (req, res) => {
    try {
        const { challenge, question, answer } = req.body;
        console.log(req.body);
        const answers = {
            text: answer,
            likes: 0
        };
        let result;

        const models = [BGIMagic, Environmagic, SDGMagic, Imagic, KidsMagic, UnIMagic, MoralMagic];

        for (let i = 0; i < models.length; i++) 
        {
            const model = models[i];
            if(model.modelName === challenge){
            result = await model.findOneAndUpdate(
                { qnum: question },
                { $push: { answers: answers } },
                { new: true }
            );
            }
            if (result) {
                break; // Stop looping if the answer is added to a model
            }
        }

        if (!result) {
            return res.status(404).json({ msg: "Question not found" });
        }
        console.log(challenge);
        return res.status(200).json({ result });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ msg: "Server error" });
    }
};

exports.updateLikes = async (req, res) => {
    try {
        const { id, likes, challenge, question } = req.body;
        console.log(req.body);
        let result;

        const models = [BGIMagic, Environmagic, SDGMagic, Imagic, KidsMagic, UnIMagic, MoralMagic];

        for (let i = 0; i < models.length; i++) {
            const model = models[i];
            console.log(model.modelName)
            if(model.modelName === challenge){
            result = await model.findOneAndUpdate(
                { _id: question, "answers._id": id },
                { $set: { "answers.$.likes": likes } },
                { new: true }
            );
            }
            if (result) {
                break; // Stop looping if the likes are updated in a model
            }
        }

        if (!result) {
            return res.status(404).json({ msg: "Answer not found" });
        }
        console.log(result);
        return res.status(200).json({ result });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ msg: "Server error" });
    }
};
