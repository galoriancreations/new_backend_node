const { BGIMagic, SDGMagic, KidsMagic, MoralMagic, UnIMagic, Environmagic, Imagic  } = require("../models/question");


exports.getQuestion = async (req, res) => {
    try 
    {
        let j;
        let result;
        const { challenge, qId } = req.body;
        const models = [BGIMagic, Environmagic, SDGMagic, Imagic, KidsMagic, UnIMagic, MoralMagic];

        for (let i = 0; i < models.length; i++) 
        {
            const model = models[i];
            if(model.modelName === challenge)
            {
                if (qId) 
                {
                    j = qId;
                }
                else
                {
                    if(challenge === "BGIMagic" || challenge === "SDGMagic" )
                    {
                        j = Math.floor(Math.random() * 18 + 1);
                    }
                    else
                    {
                        j = Math.floor(Math.random() * 20 + 1);
                    }
                }
                result = await model.findOne({ qnum: j });
            }
            if (result) 
            {
                break;
            }
        }
        return res.status(200).json({ result });
    } 
    catch (err) 
    {
        console.error(err);
        return res.status(500).json({ msg: "Server error" });
    }
};


exports.updateAnswer = async (req, res) => {
    try 
    {
        let result;
        const { challenge, question, answer } = req.body;
        const answers = { text: answer, likes: 0 };

        const models = [BGIMagic, Environmagic, SDGMagic, Imagic, KidsMagic, UnIMagic, MoralMagic];

        for (let i = 0; i < models.length; i++) 
        {
                const model = models[i];
            if(model.modelName === challenge)
            {
                result = await model.findOneAndUpdate(
                    { qnum: question },
                    { $push: { answers: answers } },
                    { new: true }
                );
            }
            if (result) 
            {
                break; 
            }
        }

        if (!result) 
        {
            return res.status(404).json({ msg: "Question not found" });
        }
        return res.status(200).json({ result });
    } 
    catch (err) 
    {
        console.error(err);
        return res.status(500).json({ msg: "Server error" });
    }
};


exports.updateLikes = async (req, res) => {
    try 
    {
        const { id, likes, challenge, question } = req.body;
        let result;

        const models = [BGIMagic, Environmagic, SDGMagic, Imagic, KidsMagic, UnIMagic, MoralMagic];

        for (let i = 0; i < models.length; i++) {
            const model = models[i];
            if(model.modelName === challenge)
            {
                result = await model.findOneAndUpdate(
                    { _id: question, "answers._id": id },
                    { $set: { "answers.$.likes": likes } },
                    { new: true }
                );
            }
            if (result) 
            {
                break; 
            }
        }

        if (!result) {
            return res.status(404).json({ msg: "Answer not found" });
        }
        return res.status(200).json({ result });
    } 
    catch (err) 
    {
        console.error(err);
        return res.status(500).json({ msg: "Server error" });
    }
};
