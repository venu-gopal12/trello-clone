const userService = require('../services/userService');

class UserController {
  async getAllUsers(req, res) {
    try {
      const users = await userService.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async register(req, res) {
    console.log("registering");
    try {
      const user = await userService.register(req.body);
      res.status(201).json(user);
    } catch (err) {
      console.log(err);
      res.status(400).json({ error: err.message });
    }
  }

  async login(req, res) {
    try {
      const data = await userService.login(req.body);
      // Optional: Set refresh token in cookie
      if(data.refreshToken) {
          res.cookie('refreshToken', data.refreshToken, { 
              httpOnly: true, 
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict',
              maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
          });
      }
      res.json(data);
    } catch (err) {
      res.status(401).json({ error: err.message });
    }
  }

  async refreshToken(req, res) {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      try {
          const data = await userService.refreshAccessToken(refreshToken);
          res.json(data);
      } catch (err) {
          res.status(403).json({ error: err.message });
      }
  }

  async googleAuth(req, res) {
      try {
          const data = await userService.googleLogin(req.body);
          if(data.refreshToken) {
            res.cookie('refreshToken', data.refreshToken, { 
                httpOnly: true, 
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 
            });
        }
          res.json(data);
      } catch (err) {
          res.status(400).json({ error: err.message });
      }
  }
}

module.exports = new UserController();
