import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  PlusOutlined,
  CheckCircleOutlined,
  FilterOutlined,
  ProjectOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { Button, Modal, Form, Input, Select, DatePicker, Tag, Upload, message, Spin, Tooltip, Popconfirm } from 'antd';
import { DragDropContext } from '@hello-pangea/dnd';
import { useAuth } from '../../context/AuthContext';
import dayjs from 'dayjs';

// Imports
import { MOCK_STATS, getColumnConfig } from './mockData';
import StatCard from './components/StatCard';
import KanbanColumn from './components/KanbanColumn';
import TaskDetailModal from './components/TaskDetailModal';

import {
  getListProjects,
  getBoardData,
  createCategory,
  createIssue,
  moveIssue,
  updateIssue,
  archiveIssue,
  updateCategory,
  archiveCategory,
  createProject,
  archiveProject,
  updateProject,
} from '../../apis/dashboard';
import { toast } from 'sonner';

const Dashboard = () => {
  const { collapsed } = useOutletContext();
  const { user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  // [CHANGE] Xóa state allMembers vì dùng trực tiếp từ project
  // const [allMembers, setAllMembers] = useState([]);

  const [categories, setCategories] = useState([]);
  const [tasks, setTasks] = useState({});
  const [loading, setLoading] = useState(false);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);

  const [isArchiveCategoryModalOpen, setIsArchiveCategoryModalOpen] = useState(false);
  const [categoryToArchive, setCategoryToArchive] = useState(null);

  // Loading States
  const [createTaskLoading, setCreateTaskLoading] = useState(false);
  const [createProjectLoading, setCreateProjectLoading] = useState(false);
  const [updateProjectLoading, setUpdateProjectLoading] = useState(false);

  const [collapsedCols, setCollapsedCols] = useState({});
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedColumnId, setSelectedColumnId] = useState(null);

  const [filterTag, setFilterTag] = useState('All');
  const [fileList, setFileList] = useState([]);

  const [form] = Form.useForm();
  const [categoryForm] = Form.useForm();
  const [projectForm] = Form.useForm();
  const [editProjectForm] = Form.useForm();

  const canEditBoard = useMemo(() => ['Admin', 'Leader', 'Seller'].includes(user?.role?.name || user?.role), [user]);
  const isAdmin = useMemo(() => user?.role?.name === 'Admin' || user?.role === 'Admin', [user]);

  // --- FETCH DATA ---
  useEffect(() => {
    const initData = async () => {
      try {
        const projectsRes = await getListProjects();
        if (projectsRes.data?.data) {
          const allProjects = projectsRes.data.data;
          setProjects(allProjects);

          if (allProjects.length > 0 && !selectedProjectId) {
            setSelectedProjectId(allProjects[0]._id);
          }
        }
      } catch (error) {
        console.error('Init data error:', error);
      }
    };
    initData();
  }, [user, isAdmin]);

  const currentProject = useMemo(() => projects.find((p) => p._id === selectedProjectId), [projects, selectedProjectId]);

  const projectMembers = useMemo(() => {
    if (!currentProject || !currentProject.members) return [];
    return currentProject.members;
  }, [currentProject]);

  const taskAssigneeOptions = useMemo(() => {
    const opts = projectMembers.map((m) => ({ label: m.full_name, value: m._id }));
    if (canEditBoard) opts.unshift({ label: 'Select All Project Members', value: 'ALL', className: 'font-bold text-blue-600' });
    return opts;
  }, [projectMembers, canEditBoard]);

  const projectMemberOptions = useMemo(() => {
    return projectMembers.map((m) => ({ label: m.full_name, value: m._id }));
  }, [projectMembers]);

  const fetchBoard = useCallback(async (projId) => {
    if (!projId) return;
    setLoading(true);
    try {
      const res = await getBoardData(projId);
      if (res.data?.data) {
        const boardData = res.data.data;
        setCategories(boardData);

        const tasksMap = {};
        boardData.forEach((cat) => {
          tasksMap[cat._id] = (cat.issues || []).map((issue) => ({
            ...issue,
            id: issue._id,
            assignees: issue.assignees || [],
            due: issue.dueAt,
            startAt: issue.startAt,
            status: issue.status,
            isCompleted: issue.status === 'done',
            activities: issue.activity || [],
            attachments: issue.attachments || [],
          }));
        });
        setTasks(tasksMap);
      }
    } catch (error) {
      console.error('Err fetch board:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchBoard(selectedProjectId);
    }
  }, [selectedProjectId, fetchBoard]);

  const handleCreateProject = async (values) => {
    setCreateProjectLoading(true);
    try {
      const res = await createProject({
        name: values.name,
        description: values.description,
        memberIds: values.members || [],
      });

      if (res.data?.data) {
        const newProject = res.data.data;
        const pid = newProject._id;
        try {
          await createCategory(pid, { name: 'To Do', type: 'todo' });
          await createCategory(pid, { name: 'In Progress', type: 'inprocess' });
          await createCategory(pid, { name: 'Done', type: 'done' });
        } catch (catErr) {
          console.error('Failed to init categories', catErr);
        }
        // toast.success('Project created successfully');
        setIsProjectModalOpen(false);
        projectForm.resetFields();
        setProjects((prev) => [newProject, ...prev]);
        setSelectedProjectId(pid);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create project');
    } finally {
      setCreateProjectLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProjectId) return;
    try {
      await archiveProject(selectedProjectId);
      // toast.success('Project deleted');
      const newProjects = projects.filter((p) => p._id !== selectedProjectId);
      setProjects(newProjects);
      if (newProjects.length > 0) {
        setSelectedProjectId(newProjects[0]._id);
      } else {
        setSelectedProjectId(null);
        setCategories([]);
        setTasks({});
      }
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  const openEditProjectModal = () => {
    if (currentProject) {
      editProjectForm.setFieldsValue({
        name: currentProject.name,
        description: currentProject.description,
        // Map members object -> ID
        members: currentProject.members?.map((m) => m._id) || [],
      });
      setIsEditProjectModalOpen(true);
    }
  };

  const handleEditProject = async (values) => {
    if (!selectedProjectId) return;
    setUpdateProjectLoading(true);
    try {
      const res = await updateProject(selectedProjectId, {
        name: values.name,
        description: values.description,
        memberIds: values.members,
      });
      if (res.data?.data) {
        const updated = res.data.data;
        // toast.success('Project updated');
        setProjects((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
        setIsEditProjectModalOpen(false);
      }
    } catch (error) {
      toast.error('Failed to update project');
    } finally {
      setUpdateProjectLoading(false);
    }
  };

  const handleAddCategory = async (values) => {
    if (!selectedProjectId) return;
    try {
      await createCategory(selectedProjectId, { name: values.name, type: values.type || 'custom' });
      // toast.success('Category created!');
      setIsCategoryModalOpen(false);
      categoryForm.resetFields();
      fetchBoard(selectedProjectId);
    } catch (error) {
      toast.error('Failed create category');
    }
  };

  const handleUpdateCategory = useCallback(
    async (categoryId, newName) => {
      try {
        await updateCategory(selectedProjectId, categoryId, { name: newName });
        // toast.success('Category updated');
        fetchBoard(selectedProjectId);
      } catch (error) {
        toast.error('Update failed');
      }
    },
    [selectedProjectId, fetchBoard]
  );

  const handleRequestArchiveCategory = (categoryId) => {
    setCategoryToArchive(categoryId);
    setIsArchiveCategoryModalOpen(true);
  };

  const handleConfirmArchiveCategory = async () => {
    if (!categoryToArchive) return;
    try {
      await archiveCategory(selectedProjectId, categoryToArchive);
      // toast.success('Category archived');
      fetchBoard(selectedProjectId);
      setIsArchiveCategoryModalOpen(false);
      setCategoryToArchive(null);
    } catch (error) {
      toast.error('Archive failed');
    }
  };

  const getStatusFromCategoryType = (type) => {
    switch (type) {
      case 'todo':
        return 'open';
      case 'inprocess':
        return 'in_progress';
      case 'done':
        return 'done';
      case 'rejected':
        return 'canceled';
      default:
        return 'open';
    }
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceColId = source.droppableId;
    const destColId = destination.droppableId;
    const destCategory = categories.find((c) => c._id === destColId);
    const newStatus = destCategory ? getStatusFromCategoryType(destCategory.type) : 'open';

    const newTasks = { ...tasks };
    const sourceItems = [...(newTasks[sourceColId] || [])];
    const destItems = sourceColId === destColId ? sourceItems : [...(newTasks[destColId] || [])];

    const [removed] = sourceItems.splice(source.index, 1);
    const updatedTask = { ...removed, categoryId: destColId, status: newStatus, isCompleted: newStatus === 'done' };
    destItems.splice(destination.index, 0, updatedTask);

    newTasks[sourceColId] = sourceItems;
    newTasks[destColId] = destItems;
    setTasks(newTasks);

    try {
      await moveIssue(selectedProjectId, draggableId, { toCategoryId: destColId, toIndex: destination.index });
      if (sourceColId !== destColId) {
        await updateIssue(selectedProjectId, draggableId, { status: newStatus });
      }
    } catch (error) {
      toast.error('Failed to update task');
      fetchBoard(selectedProjectId);
    }
  };

  const handleQuickAdd = useCallback(
    async (columnId, title, imageFile) => {
      if (!title?.trim() && !imageFile) return;

      try {
        const startAt = dayjs().toISOString();

        if (imageFile) {
          const formData = new FormData();
          formData.append('categoryId', columnId);
          formData.append('title', title || 'Image Task');
          formData.append('startAt', startAt);
          formData.append('status', 'open');
          formData.append('files', imageFile);

          await createIssue(selectedProjectId, formData);
        } else {
          await createIssue(selectedProjectId, {
            categoryId: columnId,
            title: title,
            startAt: startAt,
            status: 'open',
          });
        }

        // toast.success('Task created');
        fetchBoard(selectedProjectId);
      } catch (error) {
        console.error('Quick add failed', error);
        toast.error('Failed to create task');
      }
    },
    [selectedProjectId, fetchBoard]
  );

  const handleAddTask = async (values) => {
    if (!selectedProjectId) return;
    setCreateTaskLoading(true);
    const todoCategory = categories.find((c) => c.type === 'todo') || categories[0];
    if (!todoCategory) {
      setCreateTaskLoading(false);
      return toast.error('No category found');
    }
    let finalAssignees = values.assignees || [];
    if (finalAssignees.includes('ALL')) {
      finalAssignees = projectMembers.map((m) => m._id);
    }
    try {
      const payload = {
        categoryId: todoCategory._id,
        title: values.title,
        description: values.description || '',
        assigneeIds: finalAssignees,
        priority: values.priority,
        dueAt: values.dueDate ? values.dueDate.toISOString() : null,
        startAt: values.startDate ? values.startDate.toISOString() : dayjs().toISOString(),
        status: 'open',
        tag: values.tag,
      };

      let res;
      if (fileList.length > 0) {
        const formData = new FormData();
        Object.keys(payload).forEach((key) => {
          if (payload[key] !== null && payload[key] !== undefined) {
            if (Array.isArray(payload[key])) {
              payload[key].forEach((val) => formData.append(key, val));
            } else {
              formData.append(key, payload[key]);
            }
          }
        });
        fileList.forEach((file) => {
          formData.append('files', file.originFileObj);
        });
        res = await createIssue(selectedProjectId, formData);
      } else {
        res = await createIssue(selectedProjectId, payload);
      }

      if (res.data?.data) {
        // toast.success('Task created successfully');
        setIsModalOpen(false);
        form.resetFields();
        setFileList([]);
        fetchBoard(selectedProjectId);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create task');
    } finally {
      setCreateTaskLoading(false);
    }
  };

  const handleDeleteTask = async (taskId, colId) => {
    try {
      setTasks((prev) => ({ ...prev, [colId]: prev[colId].filter((t) => t.id !== taskId) }));
      await archiveIssue(selectedProjectId, taskId);
      // toast.success('Task deleted');
      setSelectedTask(null);
    } catch (error) {
      toast.error('Failed to delete task');
      fetchBoard(selectedProjectId);
    }
  };

  const transformTaskData = (item) => ({
    ...item,
    id: item._id,
    assignees: item.assigneeIds || [],
    due: item.dueAt,
    isCompleted: item.status === 'done',
    activities: item.activity || [],
    attachments: item.attachments || [],
  });

  const handleUpdateTask = async (updatedTask) => {
    setSelectedTask(updatedTask);

    if (updatedTask.isUploadFile || updatedTask.newLinkAttachment) {
      setTasks((prev) => {
        const colTasks = prev[selectedColumnId].map((t) => (t.id === updatedTask.id ? updatedTask : t));
        return { ...prev, [selectedColumnId]: colTasks };
      });

      if (updatedTask.newLinkAttachment) {
        try {
          const res = await updateIssue(selectedProjectId, updatedTask.id, { newLinkAttachment: updatedTask.newLinkAttachment });
          if (res.data?.data) {
            const serverTask = transformTaskData(res.data.data);
            setSelectedTask(serverTask);
            setTasks((prev) => ({
              ...prev,
              [selectedColumnId]: prev[selectedColumnId].map((t) => (t.id === serverTask.id ? serverTask : t)),
            }));
          }
        } catch (e) {
          toast.error('Failed to add link');
        }
      }
      return;
    }

    setTasks((prev) => {
      const colTasks = prev[selectedColumnId].map((t) => (t.id === updatedTask.id ? updatedTask : t));
      return { ...prev, [selectedColumnId]: colTasks };
    });

    try {
      const sanitizedAssignees = (updatedTask.assignees || []).map((member) => {
        if (member && typeof member === 'object' && member._id) {
          return member._id;
        }
        return member;
      });

      const payload = {
        title: updatedTask.title,
        description: updatedTask.description,
        priority: updatedTask.priority,
        assigneeIds: sanitizedAssignees,
        note: updatedTask.note,
        status: updatedTask.status,
        dueAt: updatedTask.due,
        startAt: updatedTask.startAt,
        attachments: updatedTask.attachments,
      };

      await updateIssue(selectedProjectId, updatedTask.id, payload);
    } catch (error) {
      console.error('Update failed', error);
      toast.error('Update failed');
    }
  };

  const handleToggleComplete = async (taskId, columnId, checked) => {
    if (!checked) {
      const newStatus = 'in_progress';
      setTasks((prev) => {
        const colTasks = prev[columnId].map((t) => (t.id === taskId ? { ...t, isCompleted: false, status: newStatus } : t));
        return { ...prev, [columnId]: colTasks };
      });
      try {
        await updateIssue(selectedProjectId, taskId, { status: newStatus });
      } catch (e) {}
      return;
    }
    const doneCategory = categories.find((c) => c.type === 'done');
    if (!doneCategory) return toast.error("Cannot find 'Done' column to complete task.");
    if (columnId === doneCategory._id) {
      setTasks((prev) => {
        const colTasks = prev[columnId].map((t) => (t.id === taskId ? { ...t, isCompleted: true, status: 'done' } : t));
        return { ...prev, [columnId]: colTasks };
      });
      await updateIssue(selectedProjectId, taskId, { status: 'done' });
      return;
    }
    const newTasks = { ...tasks };
    const sourceItems = [...(newTasks[columnId] || [])];
    const destItems = [...(newTasks[doneCategory._id] || [])];
    const taskIndex = sourceItems.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return;
    const [removed] = sourceItems.splice(taskIndex, 1);
    const updatedTask = { ...removed, categoryId: doneCategory._id, status: 'done', isCompleted: true };
    destItems.unshift(updatedTask);
    newTasks[columnId] = sourceItems;
    newTasks[doneCategory._id] = destItems;
    setTasks(newTasks);
    try {
      await moveIssue(selectedProjectId, taskId, { toCategoryId: doneCategory._id, toIndex: 0 });
      await updateIssue(selectedProjectId, taskId, { status: 'done' });
      // toast.success('Task completed & moved to Done');
    } catch (error) {
      toast.error('Failed to complete task');
      fetchBoard(selectedProjectId);
    }
  };

  const handleMoveTask = async (taskId, fromColId, toColType) => {
    const targetCat = categories.find((c) => c.type === toColType);
    if (!targetCat) return toast.error(`Cannot find column type: ${toColType}`);
    const newStatus = getStatusFromCategoryType(toColType);
    try {
      await moveIssue(selectedProjectId, taskId, { toCategoryId: targetCat._id, toIndex: 0 });
      await updateIssue(selectedProjectId, taskId, { status: newStatus });
      // toast.success(`Task moved to ${targetCat.name}`);
      fetchBoard(selectedProjectId);
      setSelectedTask(null);
    } catch (error) {
      toast.error('Move failed');
    }
  };

  const toggleColumn = useCallback((colId) => setCollapsedCols((prev) => ({ ...prev, [colId]: !prev[colId] })), []);
  const handleTaskClick = useCallback((task, colId) => {
    setSelectedTask(task);
    setSelectedColumnId(colId);
  }, []);
  const filteredTasks = useMemo(() => {
    if (filterTag === 'All') return tasks;
    const newTasks = {};
    Object.keys(tasks).forEach((key) => {
      newTasks[key] = tasks[key].filter((task) => task.tag === filterTag);
    });
    return newTasks;
  }, [tasks, filterTag]);
  const availableTags = useMemo(() => {
    const allTags = new Set(['All']);
    Object.values(tasks)
      .flat()
      .forEach((t) => {
        if (t.tag) allTags.add(t.tag);
      });
    return Array.from(allTags);
  }, [tasks]);

  const selectedCategory = useMemo(() => categories.find((c) => c._id === selectedColumnId), [categories, selectedColumnId]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div
        className={`fixed top-0 ${
          collapsed ? 'left-64' : 'left-13.5'
        } right-0 z-50 bg-white transition-all duration-300 border-b border-gray-200`}
      >
        <div className="h-[60px] px-8 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800 !mb-0">System Dashboard</h1>
          <div className="text-sm text-slate-500">Today: {dayjs().format('DD MMM, YYYY')}</div>
        </div>
      </div>

      <div className="mt-[60px] p-4 h-[calc(100vh-60px)] flex flex-col gap-6 overflow-hidden">
        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
          {MOCK_STATS.map((stat, index) => (
            <StatCard key={index} item={stat} />
          ))}
        </div> */}

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <CheckCircleOutlined className="text-blue-500" /> Team Tasks
              </h2>
              <div className="flex items-center gap-2 ml-4 bg-white p-1 rounded-md border border-slate-200">
                <ProjectOutlined className="text-slate-400 ml-2" />
                <span className="text-sm text-slate-500 font-medium">Project:</span>
                <Select
                  value={selectedProjectId}
                  onChange={setSelectedProjectId}
                  style={{ minWidth: 150 }}
                  bordered={false}
                  size="small"
                  className="font-medium"
                  loading={false}
                >
                  {projects.map((p) => (
                    <Select.Option key={p._id} value={p._id}>
                      {p.name}
                    </Select.Option>
                  ))}
                </Select>
                {isAdmin && (
                  <>
                    <Tooltip title="Create new project">
                      <Button
                        type="text"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => setIsProjectModalOpen(true)}
                        className="text-blue-500 hover:bg-blue-50"
                      />
                    </Tooltip>
                    {selectedProjectId && (
                      <Tooltip title="Edit project">
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={openEditProjectModal}
                          className="text-slate-500 hover:bg-slate-50"
                        />
                      </Tooltip>
                    )}
                    {selectedProjectId && (
                      <Tooltip title="Delete project">
                        <Popconfirm
                          title="Delete project"
                          description="Are you sure?"
                          onConfirm={handleDeleteProject}
                          okText="Yes"
                          cancelText="No"
                        >
                          <Button
                            type="text"
                            size="small"
                            icon={<DeleteOutlined />}
                            className="text-red-400 hover:bg-red-50 hover:text-red-600"
                          />
                        </Popconfirm>
                      </Tooltip>
                    )}
                  </>
                )}
              </div>
              {isAdmin && (
                <div className="flex items-center gap-2 bg-white p-1 rounded-md border border-slate-200">
                  <FilterOutlined className="text-slate-400 ml-2" />
                  <Select
                    value={filterTag}
                    onChange={setFilterTag}
                    style={{ minWidth: 100 }}
                    bordered={false}
                    size="small"
                    className="font-medium"
                  >
                    {availableTags.map((tag) => (
                      <Select.Option key={tag} value={tag}>
                        {tag}
                      </Select.Option>
                    ))}
                  </Select>
                </div>
              )}
            </div>
            {canEditBoard && (
              <div className="flex gap-2">
                <Button icon={<PlusOutlined />} onClick={() => setIsCategoryModalOpen(true)}>
                  <span className="font-medium">Add Category</span>
                </Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
                  <span className="font-medium">New Task</span>
                </Button>
              </div>
            )}
          </div>

          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
              <div className="flex h-full gap-4 pb-4 min-w-max items-start">
                {categories.map((cat) => (
                  <KanbanColumn
                    key={cat._id}
                    columnId={cat._id}
                    title={cat.name}
                    config={getColumnConfig(cat.type)}
                    items={filteredTasks[cat._id] || []}
                    collapsedCols={collapsedCols}
                    toggleColumn={toggleColumn}
                    canEditBoard={canEditBoard}
                    onTaskClick={handleTaskClick}
                    onToggleComplete={handleToggleComplete}
                    onQuickAdd={handleQuickAdd}
                    onDeleteTask={handleDeleteTask}
                    // [UPDATED] Truyền projectMembers (lấy trực tiếp từ project)
                    allMembers={projectMembers}
                    onUpdateCategory={handleUpdateCategory}
                    onRequestArchiveCategory={handleRequestArchiveCategory}
                    currentUserId={user?.id}
                  />
                ))}
              </div>
            </div>
          </DragDropContext>
        </div>
      </div>

      <Modal
        title={
          <div className="flex items-center gap-2 text-red-600">
            <ExclamationCircleOutlined /> Confirm Archive
          </div>
        }
        open={isArchiveCategoryModalOpen}
        onOk={handleConfirmArchiveCategory}
        onCancel={() => setIsArchiveCategoryModalOpen(false)}
        okText="Archive"
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to archive this category? </p>
      </Modal>

      <Modal
        title="Create New Task"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setFileList([]);
        }}
        onOk={() => form.submit()}
        okText="Create Task"
        confirmLoading={createTaskLoading}
      >
        <Form form={form} layout="vertical" onFinish={handleAddTask}>
          <Form.Item name="title" label="Task Title" rules={[{ required: true }]}>
            <Input placeholder="Enter task title..." />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea placeholder="Add a description..." rows={3} />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="assignees" label="Assign To">
              <Select placeholder="Select members" mode="multiple" allowClear options={taskAssigneeOptions} />
            </Form.Item>
            <Form.Item name="priority" label="Priority" initialValue="medium">
              <Select>
                <Select.Option value="high">
                  <Tag color="red">High</Tag>
                </Select.Option>
                <Select.Option value="medium">
                  <Tag color="orange">Medium</Tag>
                </Select.Option>
                <Select.Option value="low">
                  <Tag color="green">Low</Tag>
                </Select.Option>
              </Select>
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="startDate" label="Start Date" initialValue={dayjs()}>
              <DatePicker className="w-full" format="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item name="dueDate" label="Due Date">
              <DatePicker className="w-full" format="YYYY-MM-DD" />
            </Form.Item>
          </div>
          <Form.Item name="tag" label="Tag" initialValue="General">
            <Select>
              <Select.Option value="Design">Design</Select.Option>
              <Select.Option value="Dev">Dev</Select.Option>
              <Select.Option value="Marketing">Marketing</Select.Option>
              <Select.Option value="Seller">Seller</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Attachments">
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              beforeUpload={() => false}
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Add New Category"
        open={isCategoryModalOpen}
        onCancel={() => {
          setIsCategoryModalOpen(false);
          categoryForm.resetFields();
        }}
        onOk={() => categoryForm.submit()}
        width={400}
      >
        <Form form={categoryForm} layout="vertical" onFinish={handleAddCategory}>
          <Form.Item name="name" label="Column Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="type" label="Type" initialValue="custom">
            <Select>
              <Select.Option value="todo">To Do</Select.Option>
              <Select.Option value="inprocess">In Process</Select.Option>
              <Select.Option value="done">Done</Select.Option>
              <Select.Option value="custom">Custom</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Create New Project"
        open={isProjectModalOpen}
        onCancel={() => {
          setIsProjectModalOpen(false);
          projectForm.resetFields();
        }}
        onOk={() => projectForm.submit()}
        confirmLoading={createProjectLoading}
      >
        <Form form={projectForm} layout="vertical" onFinish={handleCreateProject}>
          <Form.Item name="name" label="Project Name" rules={[{ required: true, message: 'Please enter project name' }]}>
            <Input placeholder="e.g. Website Redesign" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Project goals..." />
          </Form.Item>
          <Form.Item name="members" label="Members">
            <Select mode="multiple" placeholder="Select members to join this project" options={projectMemberOptions} allowClear />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Edit Project"
        open={isEditProjectModalOpen}
        onCancel={() => setIsEditProjectModalOpen(false)}
        onOk={() => editProjectForm.submit()}
        confirmLoading={updateProjectLoading}
      >
        <Form form={editProjectForm} layout="vertical" onFinish={handleEditProject}>
          <Form.Item name="name" label="Project Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="members" label="Members">
            <Select mode="multiple" placeholder="Select members" options={projectMemberOptions} allowClear />
          </Form.Item>
        </Form>
      </Modal>

      <TaskDetailModal
        task={selectedTask}
        columnId={selectedColumnId}
        columnTitle={selectedCategory?.name}
        columnType={selectedCategory?.type}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdateTask={handleUpdateTask}
        onMoveTask={handleMoveTask}
        onDeleteTask={handleDeleteTask}
        onToggleComplete={handleToggleComplete}
        allMembers={projectMembers}
      />
    </div>
  );
};

export default Dashboard;
