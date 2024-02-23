const { BGIMagic, SDGMagic, KidsMagic, MoralMagic, UnIMagic, Environmagic, Imagic  } = require("../models/question");

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
        console.log("ok");
        const qId = req.body.qId;
        const challenge = req.body.challenge;
        console.log(challenge);
        let i ;
        if (qId) {
            i = qId;
        }
        else{
            if(challenge === "BGI-mAGIc"){
                i = Math.floor(Math.random() * 18 +1)
                console.log("i = " + i);
                const result = await BGIMagic.findOne({qnum:i})    
            }
            else if(challenge === "SDG-Magic"){
                i = Math.floor(Math.random() * 18 +1)
                console.log("i = " + i);
                const result = await SDGMagic.findOne({qnum:i})
            }
            else {
                i = Math.floor(Math.random() * 20 +1)
                console.log("i = " + i);

                if(challenge === "Environmagic"){
                    const result = await Environmagic.findOne({qnum:i})
                }
                else if(challenge === "Imagic"){
                    const result = await Imagic.findOne({qnum:i})
                }
                else if(challenge === "Kids-Magic"){
                    const result = await KidsMagic.findOne({qnum:i})
                } 
                else if(challenge === "Moral-Magic"){
                    const result = await MoralMagic.findOne({qnum:i})
                }
                else if(challenge === "YouAndI-Magic"){
                    const result = await UnIMagic.findOne({qnum:i})
                }
            }
        }
        return res.status(200).json({ result });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ msg: "Server error" });
    }
}

exports.getAnswer = async (req, res) => {
    try {
        let question = req.body.question;
        let qnum = req.body.qnum;
        console.log(question);
        const answer = {
            id: 'a_' + generateRandomString(),
            user: user.fullName,
            text: req.body.answer,
            likes: 0
        }
        console.log(answer);
        const findAndUpAnsBGI = await BGIMagic.findOneAndUpdate(
            {_id:question , qnum:qnum },{$push:{answers:answer}})
            console.log(findAndUpAnsBGI);
        const findAndUpAnsEnviromagic = await Environmagic.findOneAndUpdate(
            {_id:question , qnum:qnum },{$push:{answers:answer}})
            console.log(findAndUpAnsEnviromagic);
        const findAndUpAnsImagic = await Imagic.findOneAndUpdate(
            {_id:question , qnum:qnum },{$push:{answers:answer}})
            console.log(findAndUpAnsImagic);
        const findAndUpAnsSDG = await SDGMagic.findOneAndUpdate(
            {_id:question , qnum:qnum },{$push:{answers:answer}})
        console.log(findAndUpAnsSDG);
        const findAndUpAnsYouAndI = await UnIMagic.findOneAndUpdate(
            {_id:question , qnum:qnum },{$push:{answers:answer}})
            console.log(findAndUpAnsYouAndI);
        const findAndUpAnsMoral = await MoralMagic.findOneAndUpdate(
            {_id:question , qnum:qnum },{$push:{answers:answer}})
            console.log(findAndUpAnsMoral);
        const findAndUpAnsKids = await KidsMagic.findOneAndUpdate(
            {_id:question , qnum:qnum },{$push:{answers:answer}})
            console.log(findAndUpAnsKids);

        if(findAndUpAnsBGI){
            const result = await BGIMagic.find()
            final = result[parseInt(qnum)-1]
            // res.json({msg:'the answer added'})
        }
        else if(findAndUpAnsEnviromagic){
            const result = await Environmagic.find()
            final = result[parseInt(qnum)-1]
            // res.json({msg:'the answer added'})
        }
        else if(findAndUpAnsImagic){
            const result = await Imagic.find()
            final = result[parseInt(qnum)-1]
            // res.json({msg:'the answer added'})
        }
        else if(findAndUpAnsSDG){
            const result = await SDGMagic.find()
            final = result[parseInt(qnum)-1]
            // res.json({msg:'the answer added'})
        }
        else if(findAndUpAnsYouAndI){
            const result = await UnIMagic.find()
            final = result[parseInt(qnum)-1]
            // res.json({msg:'the answer added'})
        }
        else if(findAndUpAnsMoral){
            const result = await MoralMagic.find()
            final = result[parseInt(qnum)-1]
            // res.json({msg:'the answer added'})
        }
        else if(findAndUpAnsKids){
            const result = await KidsMagic.find()
            final = result[parseInt(qnum)-1]
            // res.json({msg:'the answer added'})
        }

        return res.status(200).json({ final });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ msg: "Server error" });
    }
}
exports.updateLikes = async (req, res) => {
    try {
        let qnum = req.body.qnum;
        let id =  req.body.id;
        let likes = req.body.likes;

        const findAndUpLikesBGI = await BGIMagic.updateOne(
            { qnum: qnum, "answers.id": id },
            { $set: { "answers.$.likes": likes } }
        )
        const findAndUpLikesEnviromagic = await Environmagic.updateOne(
            { qnum: qnum, "answers.id": id },
            { $set: { "answers.$.likes": likes } }
        )
        const findAndUpLikesImagic = await Imagic.updateOne(
            { qnum: qnum, "answers.id": id },
            { $set: { "answers.$.likes": likes } }
        )
        const findAndUpLikesSDG = await SDGMagic.updateOne(
            { qnum: qnum, "answers.id": id },
            { $set: { "answers.$.likes": likes } }
        )
        const findAndUpLikesYouAndI = await UnIMagic.updateOne(
            { qnum: qnum, "answers.id": id },
            { $set: { "answers.$.likes": likes } }
        )
        const findAndUpLikesMoral = await MoralMagic.updateOne(
            { qnum: qnum, "answers.id": id },
            { $set: { "answers.$.likes": likes } }
        )
        const findAndUpLikesKids = await KidsMagic.updateOne(
            { qnum: qnum, "answers.id": id },
            { $set: { "answers.$.likes": likes } }
        )

        if(findAndUpLikesBGI || findAndUpLikesEnviromagic || findAndUpLikesImagic || findAndUpLikesSDG || findAndUpLikesYouAndI || findAndUpLikesMoral || findAndUpLikesKids){
            qnum = "";
            id = "";
            likes = 0;
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json({ msg: "Server error" });
    }
}