const ContactMessage = require("./contactMessage.model");

const createMessage = async (req, res, next) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide name, email, and message.",
      });
    }

    const newMessage = await ContactMessage.create({ name, email, message });
    res.status(201).json({
      status: "success",
      data: { message: newMessage },
    });
  } catch (error) {
    next(error);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.status(200).json({
      status: "success",
      results: messages.length,
      data: { messages },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMessage,
  getMessages,
};
