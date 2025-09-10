const express = require("express");
const {
  signupValidation,
  loginValidation,
  handleValidationErrors,
} = require("../middleware/validation");
const { createUser, authenticateUser } = require("../services/userService");

const router = express.Router();

// 회원가입
router.post(
  "/signup",
  signupValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const result = await createUser(req.body);

      res.status(201).json({
        status: "success",
        access_token: result.token,
        expires_in: 7200,
      });
    } catch (error) {
      res.status(400).json({
        status: "error",
        error_code: "SIGNUP_FAILED",
        message: error.message,
      });
    }
  }
);

// 로그인
router.post(
  "/login",
  loginValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const result = await authenticateUser(email, password);

      res.json({
        status: "success",
        access_token: result.token,
        expires_in: 7200,
      });
    } catch (error) {
      res.status(401).json({
        status: "error",
        error_code: "LOGIN_FAILED",
        message: error.message,
      });
    }
  }
);

module.exports = router;
