const { Project, Task, Employee, EmployeeProject, EmployeeTask } = require('../models');

// Get all projects
const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.findAll({
      include: [{
        model: Employee,
        attributes: ['id', 'email', 'firstName', 'lastName'],
        through: { attributes: [] }
      }]
    });
    
    res.json(projects);
  } catch (error) {
    console.error('Error getting projects:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get project by ID
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const project = await Project.findByPk(id, {
      include: [
        {
          model: Employee,
          attributes: ['id', 'email', 'firstName', 'lastName'],
          through: { attributes: [] }
        },
        {
          model: Task
        }
      ]
    });
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    console.error('Error getting project:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create project
const createProject = async (req, res) => {
  try {
    const { name, description, employeeIds = [] } = req.body;
    
    const project = await Project.create({
      name,
      description
    });
    
    // Create default task for the project
    const defaultTask = await Task.create({
      name: 'Default Task',
      description: 'Default task for the project',
      isDefault: true,
      projectId: project.id
    });
    
    // Assign employees to project if specified
    if (employeeIds.length > 0) {
      const projectAssignments = employeeIds.map(employeeId => ({
        EmployeeId: employeeId,
        ProjectId: project.id
      }));
      
      await EmployeeProject.bulkCreate(projectAssignments);
      
      // Assign employees to the default task
      const taskAssignments = employeeIds.map(employeeId => ({
        EmployeeId: employeeId,
        TaskId: defaultTask.id
      }));
      
      await EmployeeTask.bulkCreate(taskAssignments);
    }
    
    // Return the created project with assigned employees
    const projectWithEmployees = await Project.findByPk(project.id, {
      include: [
        {
          model: Employee,
          attributes: ['id', 'email', 'firstName', 'lastName'],
          through: { attributes: [] }
        },
        {
          model: Task
        }
      ]
    });
    
    res.status(201).json(projectWithEmployees);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update project
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive, employeeIds } = req.body;
    
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Update project details
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (isActive !== undefined) project.isActive = isActive;
    
    await project.save();
    
    // Update employee assignments if specified
    if (employeeIds !== undefined) {
      // Remove current employee assignments
      await EmployeeProject.destroy({
        where: { ProjectId: project.id }
      });
      
      // Get default task for the project
      const defaultTask = await Task.findOne({
        where: {
          projectId: project.id,
          isDefault: true
        }
      });
      
      // Remove employee assignments from the default task
      if (defaultTask) {
        await EmployeeTask.destroy({
          where: { TaskId: defaultTask.id }
        });
      }
      
      // Add new employee assignments
      if (employeeIds.length > 0) {
        const projectAssignments = employeeIds.map(employeeId => ({
          EmployeeId: employeeId,
          ProjectId: project.id
        }));
        
        await EmployeeProject.bulkCreate(projectAssignments);
        
        // Assign employees to the default task
        if (defaultTask) {
          const taskAssignments = employeeIds.map(employeeId => ({
            EmployeeId: employeeId,
            TaskId: defaultTask.id
          }));
          
          await EmployeeTask.bulkCreate(taskAssignments);
        }
      }
    }
    
    // Return the updated project with assigned employees
    const updatedProject = await Project.findByPk(project.id, {
      include: [
        {
          model: Employee,
          attributes: ['id', 'email', 'firstName', 'lastName'],
          through: { attributes: [] }
        },
        {
          model: Task
        }
      ]
    });
    
    res.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete project
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Instead of hard delete, deactivate the project
    project.isActive = false;
    await project.save();
    
    res.json({ message: 'Project deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating project:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get projects for authenticated employee
const getMyProjects = async (req, res) => {
  try {
    const employeeId = req.employee.id;
    
    const employee = await Employee.findByPk(employeeId, {
      include: [
        {
          model: Project,
          where: { isActive: true },
          through: { attributes: [] }
        }
      ]
    });
    
    res.json(employee.Projects || []);
  } catch (error) {
    console.error('Error getting employee projects:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getMyProjects
};