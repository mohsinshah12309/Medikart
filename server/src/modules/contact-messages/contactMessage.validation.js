const { z } = require("zod");

const createMessageSchema = z.object({
  name: z.string({ required_error: "Name is required" }).trim().min(2, "Name must be at least 2 characters").max(100, "Name cannot exceed 100 characters"),
  email: z.string({ required_error: "Email is required" }).trim().email("Please enter a valid email address").max(150),
  message: z.string({ required_error: "Message is required" }).trim().min(5, "Message must be at least 5 characters").max(2000, "Message cannot exceed 2000 characters"),
  subject: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(30).optional(),
}).strict();

module.exports = {
  createMessageSchema,
};
