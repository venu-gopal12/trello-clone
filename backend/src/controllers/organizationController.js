const organizationService = require('../services/organizationService');
const memberService = require('../services/memberService');

class OrganizationController {
  async create(req, res) {
    try {
      const { name, slug, logo_url } = req.body;
      const org = await organizationService.createOrganization(req.user.id, { name, slug, logo_url });
      res.status(201).json(org);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAll(req, res) {
    try {
      const orgs = await organizationService.getUserOrganizations(req.user.id);
      res.json(orgs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getOne(req, res) {
    try {
      const org = await organizationService.getOrganizationById(req.user.id, req.params.id);
      res.json(org);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      const org = await organizationService.updateOrganization(req.user.id, req.params.id, req.body);
      res.json(org);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async delete(req, res) {
    try {
      await organizationService.deleteOrganization(req.user.id, req.params.id);
      res.json({ message: 'Organization deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Member Management
  async getMembers(req, res) {
    try {
      const members = await memberService.getOrganizationMembers(req.params.id, req.user.id);
      res.json(members);
    } catch (error) {
      res.status(error.message === 'Unauthorized' ? 403 : 500).json({ error: error.message });
    }
  }

  async addMember(req, res) {
    try {
      const member = await memberService.addMember(req.params.id, req.user.id, req.body);
      res.status(201).json(member);
    } catch (error) {
      const status = error.message.includes('Unauthorized') ? 403 : 
                     error.message.includes('not found') ? 404 : 
                     error.message.includes('already a member') ? 409 : 500;
      res.status(status).json({ error: error.message });
    }
  }

  async updateMemberRole(req, res) {
    try {
      const result = await memberService.updateMemberRole(
        req.params.id, 
        req.user.id, 
        req.params.userId, 
        req.body.role
      );
      res.json(result);
    } catch (error) {
      const status = error.message.includes('Unauthorized') ? 403 : 
                     error.message.includes('last admin') ? 400 : 500;
      res.status(status).json({ error: error.message });
    }
  }

  async removeMember(req, res) {
    try {
      const result = await memberService.removeMember(req.params.id, req.user.id, req.params.userId);
      res.json(result);
    } catch (error) {
      const status = error.message.includes('Unauthorized') ? 403 : 
                     error.message.includes('last admin') ? 400 : 500;
      res.status(status).json({ error: error.message });
    }
  }
}

module.exports = new OrganizationController();
