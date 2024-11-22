const jwt = require('jsonwebtoken');
const { handleValidation, ValidationError } = require('../../../utils/responseHandler');
const prisma = require('../../../config/prisma');
const bcrypt = require('bcryptjs');

const authService = {
  register: async (email, password, confirmPassword, name, phone, address) => {
    handleValidation({
      email: { value: email, message: "The email field is required." },
      password: { value: password, message: "The password field is required." },
      confirmPassword: { value: confirmPassword, message: "The confirm password field is required." },
      name: { value: name, message: "The name field is required." }
    });

    if (password !== confirmPassword) {
      throw new ValidationError({
        password: ["The password and confirm password do not match."],
        confirmPassword: ["The password and confirm password do not match."]
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ValidationError({
        email: ["The email has already been taken."]
      });
    }

    const user = await prisma.user.create({
      data: {
        email,
        password: await bcrypt.hash(password, 10),
        name,
        phone,
        address
      },
      select: { id: true, email: true, name: true, phone: true, address: true}
    });

    return user;
  },
  login: async (email, password) => {
    handleValidation({
      email: { value: email, message: "The email field is required." },
      password: { value: password, message: "The password field is required." }
    });

    const user = await prisma.user.findUnique({ where: { email } });
    const isValidCredentials = user && (await bcrypt.compare(password, user.password));

    if (!isValidCredentials) {
      throw new ValidationError({
        email: ["The email or password is incorrect."]
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET, 
      { expiresIn: '1d' }
    );

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      address: user.address,
      isVerified: user.isVerified,
      token
    };
  }
};

module.exports = authService;