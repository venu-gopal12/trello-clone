const adminService = require('../services/adminService');

class AdminController {
  // ==================== User Management ====================

  async getAllUsers(req, res) {
    try {
      const { page, limit, search, role, suspended } = req.query;
      const result = await adminService.getAllUsers({ page, limit, search, role, suspended });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getUserById(req, res) {
    try {
      const user = await adminService.getUserById(req.params.id);
      res.json(user);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async suspendUser(req, res) {
    try {
      const { reason } = req.body;
      await adminService.suspendUser(req.user.id, req.params.id, reason);
      res.json({ message: 'User suspended successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async activateUser(req, res) {
    try {
      await adminService.activateUser(req.user.id, req.params.id);
      res.json({ message: 'User activated successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateUserRole(req, res) {
    try {
      const { role } = req.body;
      
      // Prevent users from changing their own role
      if (parseInt(req.params.id) === req.user.id) {
        return res.status(403).json({ error: 'Cannot change your own role' });
      }

      await adminService.updateUserRole(req.user.id, req.params.id, role);
      res.json({ message: 'User role updated successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteUser(req, res) {
    try {
      // Prevent users from deleting themselves
      if (parseInt(req.params.id) === req.user.id) {
        return res.status(403).json({ error: 'Cannot delete your own account' });
      }

      await adminService.deleteUser(req.user.id, req.params.id);
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // ==================== Organization Management ====================

  async getAllOrganizations(req, res) {
    try {
      const { page, limit, search } = req.query;
      const result = await adminService.getAllOrganizations({ page, limit, search });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getOrganizationById(req, res) {
    try {
      const organization = await adminService.getOrganizationById(req.params.id);
      res.json(organization);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async deleteOrganization(req, res) {
    try {
      await adminService.deleteOrganization(req.user.id, req.params.id);
      res.json({ message: 'Organization deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // ==================== Analytics ====================

  async getAnalytics(req, res) {
    try {
      const analytics = await adminService.getPlatformAnalytics();
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // ==================== Audit Logs ====================

  async getAuditLogs(req, res) {
    try {
      const { page, limit, adminUserId, actionType } = req.query;
      const result = await adminService.getAdminAuditLogs({ page, limit, adminUserId, actionType });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new AdminController();
