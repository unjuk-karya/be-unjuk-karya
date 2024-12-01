const jwt = require('jsonwebtoken');
const { handleValidation, ValidationError } = require('../../../utils/responseHandler');
const prisma = require('../../../config/prisma');
const bcrypt = require('bcryptjs');

const authService = {
  register: async (data) => {
    const { email, username, password, confirmPassword } = data;
  
    handleValidation({
      email: { value: email, message: "The email field is required." },
      username: { value: username, message: "The username field is required." },
      password: { value: password, message: "The password field is required." },
      confirmPassword: { value: confirmPassword, message: "The confirm password field is required." },
    });
  
    if (password !== confirmPassword) {
      throw new ValidationError({
        password: ["The password and confirm password do not match."],
        confirmPassword: ["The password and confirm password do not match."]
      });
    }
  
    const [existingUserEmail, existingUserUsername] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      prisma.user.findUnique({ where: { username } })
    ]);
  
    const errors = {};
    if (existingUserEmail) {
      errors.email = ["The email has already been taken."];
    }
    if (existingUserUsername) {
      errors.username = ["The username has already been taken."];
    }
    if (Object.keys(errors).length > 0) {
      throw new ValidationError(errors);
    }
  
    try {
      const user = await prisma.user.create({
        data: {
          email,
          username,
          password: await bcrypt.hash(password, 10)
        },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          phone: true,
          address: true,
          bio: true,
          avatar: true,
          coverPhoto: true
        }
      });
  
      return user;
    } catch (error) {
      throw new Error("Failed to register user");
    }
  },

  login: async (data) => {
    const { identifier, password } = data;

    handleValidation({
      identifier: { value: identifier, message: "The email or username field is required." },
      password: { value: password, message: "The password field is required." }
    });

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier }
        ]
      }
    });

    const isValidCredentials = user && (await bcrypt.compare(password, user.password));

    if (!isValidCredentials) {
      throw new ValidationError({
        identifier: ["The credentials provided are incorrect."]
      });
    }

    try {
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET
      );
      return {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar,
        bio: user.bio,
        coverPhoto: user.coverPhoto,
        token
      };
    } catch (error) {
      throw new Error("Failed to login");
    }
  }
};

module.exports = authService;