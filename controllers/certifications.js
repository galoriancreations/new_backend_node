const { sendEmail } = require("../services/nodemailer");

exports.sendCertification = async (req, res) => {
  try {
    console.log("sendCertifications from controller/certifications.js");

    const { certification } = req.body;
    const { member, pdf } = certification;
    if (!member) {
      return res.status(400).json({ msg: "No member provided" });
    }
    if (!pdf) {
      return res.status(400).json({ msg: "No certification provided" });
    }
    if (!member.email) {
      return res.status(400).json({ msg: "No email provided" });
    }
    // Remove data URI prefix if it exists
    const base64String = pdf.replace(/^data:application\/pdf;base64,/, "");

    // Convert base64 string to binary data
    const pdfFile = Buffer.from(base64String, "base64");

    // Send email with pdf attachment
    console.log(`Sending certification to ${member.email}`);
    await sendEmail({
      html: "Your certification",
      to: member.email,
      subject: "Your certification",
      attachments: [{ filename: "certification.pdf", content: pdfFile }]
    });

    res.status(200).json({ msg: "Certification sent" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};
