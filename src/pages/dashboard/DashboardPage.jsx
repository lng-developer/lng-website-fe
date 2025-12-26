import React, { useState, useMemo, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { PlusOutlined, CheckCircleOutlined, FilterOutlined } from '@ant-design/icons';
import { Button, Modal, Form, Input, Select, DatePicker, Tag, Upload, message } from 'antd';
import { DragDropContext } from '@hello-pangea/dnd';
import { useAuth } from '../../context/AuthContext';
import dayjs from 'dayjs';

// Imports from split files
import { MOCK_STATS, MOCK_TASKS, COLUMN_CONFIG, ALL_MEMBERS } from './mockData';
import StatCard from './components/StatCard';
import KanbanColumn from './components/KanbanColumn';
import TaskDetailModal from './components/TaskDetailModal';

const Dashboard = () => {
  const { collapsed } = useOutletContext();
  const { user } = useAuth();

  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [collapsedCols, setCollapsedCols] = useState({});
  const [form] = Form.useForm();

  const [filterTag, setFilterTag] = useState('All');

  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedColumnId, setSelectedColumnId] = useState(null);

  const [fileList, setFileList] = useState([]);

  // Phân quyền
  const canEditBoard = useMemo(() => ['Admin', 'Leader'].includes(user?.role), [user]);
  const isAdmin = useMemo(() => user?.role === 'Admin', [user]);

  // Logic lọc Task theo Tag
  const filteredTasks = useMemo(() => {
    if (filterTag === 'All') return tasks;

    const newTasks = {};
    Object.keys(tasks).forEach((key) => {
      newTasks[key] = tasks[key].filter((task) => task.tag === filterTag);
    });
    return newTasks;
  }, [tasks, filterTag]);

  // Lấy danh sách Tag unique
  const availableTags = useMemo(() => {
    const allTags = new Set(['All']);
    Object.values(tasks)
      .flat()
      .forEach((t) => {
        if (t.tag) allTags.add(t.tag);
      });
    return Array.from(allTags);
  }, [tasks]);

  // Tạo Options cho Select Assignee (Có nút Select All)
  const assigneeOptions = useMemo(() => {
    const opts = ALL_MEMBERS.map((m) => ({ label: m, value: m }));
    if (canEditBoard) {
      opts.unshift({ label: 'Select All Team', value: 'ALL', className: 'font-bold text-blue-600' });
    }
    return opts;
  }, [canEditBoard]);

  // --- HANDLERS ---

  const toggleColumn = useCallback((colId) => {
    setCollapsedCols((prev) => ({ ...prev, [colId]: !prev[colId] }));
  }, []);

  const onDragEnd = useCallback(
    (result) => {
      const { source, destination } = result;
      if (!destination) return;
      if (source.droppableId === destination.droppableId && source.index === destination.index) return;

      if (filterTag !== 'All') return; // Không cho kéo thả khi đang filter

      setTasks((prevTasks) => {
        const sourceColId = source.droppableId;
        const destColId = destination.droppableId;
        const sourceItems = [...prevTasks[sourceColId]];
        const destItems = sourceColId === destColId ? sourceItems : [...prevTasks[destColId]];

        const [removed] = sourceItems.splice(source.index, 1);
        destItems.splice(destination.index, 0, removed);

        return { ...prevTasks, [sourceColId]: sourceItems, [destColId]: destItems };
      });
    },
    [filterTag]
  );

  // Tạo task mới từ Modal
  const handleAddTask = (values) => {
    let finalAssignees = values.assignees || [];
    // Logic nút Select All Team
    if (finalAssignees.includes('ALL')) {
      finalAssignees = ALL_MEMBERS;
    }

    const newAttachments = fileList.map((file) => URL.createObjectURL(file.originFileObj));

    const newTask = {
      id: `new_${Date.now()}`,
      title: values.title,
      assignees: finalAssignees,
      priority: values.priority,
      due: dayjs(values.dueDate).format('YYYY-MM-DD'),
      tag: values.tag,
      description: '',
      note: '',
      isCompleted: false,
      attachments: newAttachments,
      // Activity log ban đầu thay vì comment
      activities: [
        {
          user: user?.username || 'Admin',
          action: 'created this task',
          time: dayjs().format('MMM D at h:mm A'),
        },
      ],
    };

    // Mở cột Todo nếu đang đóng để thấy task mới
    setCollapsedCols((prev) => ({ ...prev, todo: false }));
    setTasks((prev) => ({ ...prev, todo: [newTask, ...prev.todo] }));

    setIsModalOpen(false);
    form.resetFields();
    setFileList([]);
    message.success('Task created successfully');
  };

  // Tạo task nhanh từ cột (Quick Add)
  const handleQuickAdd = useCallback(
    (title, imageSrc) => {
      const newTask = {
        id: `quick_${Date.now()}`,
        title: title,
        assignees: [],
        priority: 'Medium',
        due: dayjs().format('YYYY-MM-DD'),
        tag: 'General',
        description: '',
        note: '',
        isCompleted: false,
        attachments: imageSrc ? [imageSrc] : [],
        activities: [
          {
            user: user?.username || 'Admin',
            action: 'created this task via Quick Add',
            time: dayjs().format('MMM D at h:mm A'),
          },
        ],
      };
      setTasks((prev) => ({ ...prev, todo: [newTask, ...prev.todo] }));
      message.success('Task created');
    },
    [user]
  );

  const handleTaskClick = useCallback((task, colId) => {
    setSelectedTask(task);
    setSelectedColumnId(colId);
  }, []);

  const handleUpdateTask = (updatedTask) => {
    setSelectedTask(updatedTask);
    setTasks((prev) => {
      const columnTasks = prev[selectedColumnId].map((t) => (t.id === updatedTask.id ? updatedTask : t));
      return { ...prev, [selectedColumnId]: columnTasks };
    });
  };

  const handleToggleComplete = useCallback((taskId, columnId, checked) => {
    setTasks((prev) => {
      const columnTasks = prev[columnId].map((t) => (t.id === taskId ? { ...t, isCompleted: checked } : t));
      return { ...prev, [columnId]: columnTasks };
    });
  }, []);

  const handleMoveTask = (taskId, fromColId, toColId) => {
    setTasks((prev) => {
      const sourceItems = [...prev[fromColId]];
      const taskIndex = sourceItems.findIndex((t) => t.id === taskId);
      if (taskIndex === -1) return prev;
      const [task] = sourceItems.splice(taskIndex, 1);
      const destItems = [...(prev[toColId] || []), task];
      return { ...prev, [fromColId]: sourceItems, [toColId]: destItems };
    });
    setSelectedTask(null); // Đóng modal sau khi chuyển
    message.success(`Task moved to ${COLUMN_CONFIG[toColId].title}`);
  };

  const handleDeleteTask = useCallback((taskId, colId) => {
    setTasks((prev) => {
      const newColTasks = prev[colId].filter((t) => t.id !== taskId);
      return { ...prev, [colId]: newColTasks };
    });
    setSelectedTask(null);
    message.success('Task deleted successfully');
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header giả lập để khớp layout */}
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
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
          {MOCK_STATS.map((stat, index) => (
            <StatCard key={index} item={stat} />
          ))}
        </div>

        {/* Board Section */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <CheckCircleOutlined className="text-blue-500" /> Team Tasks
              </h2>

              {/* Admin Filter */}
              {isAdmin && (
                <div className="flex items-center gap-2 ml-4 bg-white p-1 rounded-md border border-slate-200">
                  <FilterOutlined className="text-slate-400 ml-2" />
                  <Select
                    value={filterTag}
                    onChange={setFilterTag}
                    style={{ minWidth: 120 }}
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
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
                New Task
              </Button>
            )}
          </div>

          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
              <div className="flex h-full gap-4 pb-4 min-w-max items-start">
                {Object.keys(COLUMN_CONFIG).map((colId) => (
                  <KanbanColumn
                    key={colId}
                    columnId={colId}
                    items={filteredTasks[colId] || []}
                    collapsedCols={collapsedCols}
                    toggleColumn={toggleColumn}
                    canEditBoard={canEditBoard}
                    onTaskClick={handleTaskClick}
                    onToggleComplete={handleToggleComplete}
                    onQuickAdd={handleQuickAdd}
                    onDeleteTask={handleDeleteTask} // Truyền prop xóa xuống
                  />
                ))}
              </div>
            </div>
          </DragDropContext>
        </div>
      </div>

      {/* Modal Create Task */}
      <Modal
        title="Create New Task"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        okText="Create Task"
      >
        <Form form={form} layout="vertical" onFinish={handleAddTask}>
          <Form.Item name="title" label="Task Title" rules={[{ required: true }]}>
            <Input placeholder="Enter task title..." />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="assignees" label="Assign To" rules={[{ required: true }]}>
              <Select placeholder="Select members" mode="multiple" allowClear options={assigneeOptions} />
            </Form.Item>
            <Form.Item name="priority" label="Priority" initialValue="Medium">
              <Select>
                <Select.Option value="High">
                  <Tag color="red">High</Tag>
                </Select.Option>
                <Select.Option value="Medium">
                  <Tag color="orange">Medium</Tag>
                </Select.Option>
                <Select.Option value="Low">
                  <Tag color="green">Low</Tag>
                </Select.Option>
              </Select>
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="dueDate" label="Due Date" rules={[{ required: true }]}>
              <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item name="tag" label="Tag" initialValue="General">
              <Select>
                <Select.Option value="Design">Design</Select.Option>
                <Select.Option value="Dev">Development</Select.Option>
                <Select.Option value="Marketing">Marketing</Select.Option>
                <Select.Option value="Seller">Seller</Select.Option>
              </Select>
            </Form.Item>
          </div>

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

      {/* Modal Task Detail */}
      <TaskDetailModal
        task={selectedTask}
        columnId={selectedColumnId}
        open={!!selectedTask}
        onClose={() => {
          setSelectedTask(null);
          setSelectedColumnId(null);
        }}
        onUpdateTask={handleUpdateTask}
        onMoveTask={handleMoveTask}
        onDeleteTask={handleDeleteTask}
      />
    </div>
  );
};

export default Dashboard;
