const { Certification } = require("../models/ceritifications");
const { sendEmail } = require("../services/nodemailer");
const { User } = require("../models/user");

exports.sendCertification = async (req, res) => {
  try {
    console.log("sendCertifications from controller/certifications.js");

    const { member, pdfBase64: pdf, type, template } = req.body;
    if (!type || !template || !member || !pdf || !member.email) {
      return res.status(400).json({ msg: "Invalid request" });
    }

    let existingCertification = await Certification.findOne({ email: member.email });

    if (
      existingCertification &&
      existingCertification.types[type]?.[template.type]?.type === template.type
    ) {
      return res
        .status(400)
        .json({ msg: "Member already has certification of this type" });
    }

    const base64String = pdf.replace(/^data:application\/pdf;base64,/, "");
    const pdfFile = Buffer.from(base64String, "base64");

    console.log(`Sending certification to ${member.email}`);
    await sendEmail({
      html: "Your certification",
      to: member.email,
      subject: "Your certification",
      attachments: [{ filename: "certification.pdf", content: pdfFile }]
    });

    if (existingCertification) {
      console.log("existingCertification", existingCertification);
      await Certification.updateOne(
        { _id: existingCertification._id },
        { $set: { [`types.${type}.${template.type}`]: template } }
      );
    } else {
      let memberData =
        (await User.findOne({ email: member.email })) ||
        (await User.findOne({ phone: member.phone }));
      if (!memberData) {
        return res.status(400).json({ msg: "Member not found" });
      }
      const newCertification = new Certification({
        _id: memberData._id || null,
        email: member.email,
        phone: member.phone,
        types: { [type]: { [template.type]: template } }
      });
      await newCertification.save();
    }
    return res.status(200).json({ msg: "Certification sent" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};

exports.getCertificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const certification = await Certification.findOne({
      $or: [{ email: id }, { phone: id }]
    });
    if (!certification) {
      return res.status(200).json({ certification: null });
    }

    const { type, template } = req.body;
    if (
      !type ||
      !template ||
      certification.types[type]?.[template.type]?.type !== template.type
    ) {
      return res.status(200).json({ certification: null });
    }

    return res.status(200).json({ certification });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};

exports.getCertifications = async (req, res) => {
  try {
    console.log("getCertifications from controller/certifications.js");

    const { type } = req.params;
    if (!type) {
      return res.status(400).json({ msg: "No type provided" });
    }
    const certifications = await Certification.find({
      [`types.${type}`]: { $exists: true }
    });
    res.status(200).json(certifications);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};
