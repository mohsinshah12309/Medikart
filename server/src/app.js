const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Base Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// FR-SYS-01: Bare GET /health endpoint (Phase 1 scaffolding)
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Start Server if run directly
const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
