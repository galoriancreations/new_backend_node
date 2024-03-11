
const mongoose = require('mongoose');
const { User } = require("../models/user");
const { Challenge } = require("../models/challenge");

exports.createChallenge = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const challengeData = req.body;

    if (!challengeData || !challengeData.name || !challengeData.description) {
      return res.status(400).json({ msg: "No challenge data provided" });
    }

    const newChallenge = new Challenge({
      creator: user._id,
      name: challengeData.name,
      description: challengeData.description,
      date: new Date(),
      // Add other fields as necessary
    });

    await newChallenge.save();

    // Update user's createdChallenges array
    user.createdChallenges.push(newChallenge._id);
    await user.save();

    return res.status(201).json({
      msg: "Challenge created successfully",
      challenge: newChallenge,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Server error" });
  }
};


