const prisma = require('../../../config/prisma');

const userService = {
  searchUsers: async (query) => {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { username: { contains: query } }
        ]
      },
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true
      },
      take: 10
    });

    return users;
  }
};

module.exports = userService;