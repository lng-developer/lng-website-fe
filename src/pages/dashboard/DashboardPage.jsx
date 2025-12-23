import React, { useState, useMemo, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { PlusOutlined, CheckCircleOutlined, FilterOutlined } from '@ant-design/icons';
import { Button, Modal, Form, Input, Select, DatePicker, Tag, Upload } from 'antd';
import { DragDropContext } from '@hello-pangea/dnd';
import { useAuth } from '../../context/AuthContext';
import dayjs from 'dayjs';

// Imports from split files
import { COLUMN_CONFIG, MOCK_STATS, MOCK_TASKS } from './mockData';
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

  // State Filter by Tag (New Feature)
  const [filterTag, setFilterTag] = useState('All');

  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedColumnId, setSelectedColumnId] = useState(null);
  const [fileList, setFileList] = useState([]);

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

  // Lấy danh sách Tag unique để hiển thị trong Select
  const availableTags = useMemo(() => {
    const allTags = new Set(['All']);
    Object.values(tasks)
      .flat()
      .forEach((t) => {
        if (t.tag) allTags.add(t.tag);
      });
    return Array.from(allTags);
  }, [tasks]);

  const toggleColumn = useCallback((colId) => {
    setCollapsedCols((prev) => ({ ...prev, [colId]: !prev[colId] }));
  }, []);

  const onDragEnd = useCallback(
    (result) => {
      const { source, destination } = result;
      if (!destination) return;
      if (source.droppableId === destination.droppableId && source.index === destination.index) return;

      // Lưu ý: Khi đang Filter, việc kéo thả có thể gây rối index.
      // Tạm thời tắt DnD khi đang filter hoặc chỉ cập nhật state gốc cẩn thận.
      // Ở đây để đơn giản và an toàn, ta chỉ cho phép kéo thả khi đang xem "All".
      if (filterTag !== 'All') {
        // Có thể hiện thông báo: "Vui lòng chuyển về chế độ All để sắp xếp"
        return;
      }

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

  const handleAddTask = (values) => {
    const newAttachments = fileList.map((file) => URL.createObjectURL(file.originFileObj));
    const newTask = {
      id: `new_${Date.now()}`,
      title: values.title,
      assignee: values.assignee,
      priority: values.priority,
      due: dayjs(values.dueDate).format('YYYY-MM-DD'),
      tag: values.tag,
      description: '',
      note: '',
      isCompleted: false,
      attachments: newAttachments,
      comments: [],
    };
    setCollapsedCols((prev) => ({ ...prev, todo: false }));
    setTasks((prev) => ({ ...prev, todo: [newTask, ...prev.todo] }));
    setIsModalOpen(false);
    form.resetFields();
    setFileList([]);
  };

  const handleQuickAdd = useCallback((title, imageSrc) => {
    const newTask = {
      id: `quick_${Date.now()}`,
      title: title,
      assignee: 'Unassigned',
      priority: 'Medium',
      due: dayjs().format('YYYY-MM-DD'),
      tag: 'General',
      description: '',
      note: '',
      isCompleted: false,
      attachments: imageSrc ? [imageSrc] : [],
      comments: [],
    };
    setTasks((prev) => ({ ...prev, todo: [newTask, ...prev.todo] }));
  }, []);

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
    setSelectedTask(null);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div
        className={`fixed top-0 ${
          collapsed ? 'left-64' : 'left-13.5'
        } right-0 z-50 bg-white transition-all duration-300 border-b border-gray-200`}
      >
        <div className="h-[60px] px-8 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800 !mb-0">Dashboard</h1>
          <div className="text-sm text-slate-500">Today: {dayjs().format('DD MMM, YYYY')}</div>
        </div>
      </div>

      <div className="mt-[60px] p-4 h-[calc(100vh-60px)] flex flex-col gap-6 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
          {MOCK_STATS.map((stat, index) => (
            <StatCard key={index} item={stat} />
          ))}
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <CheckCircleOutlined className="text-blue-500" /> Team Tasks
              </h2>

              {/* Yêu cầu: Filter Tag cho Admin */}
              {isAdmin && (
                <div className="flex  gap-2 ml-4 bg-white p-1 rounded-md border border-slate-200">
                  <FilterOutlined className="text-slate-400 ml-2" />
                  {/* <span className="text-sm text-slate-500 font-medium">Filter Tag:</span> */}
                  <Select
                    value={filterTag}
                    onChange={setFilterTag}
                    style={{ minWidth: 120 }}
                    bordered={false}
                    size="small"
                    className="font-medium flex items-center justify-center"
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
                    items={filteredTasks[colId] || []} // Pass filtered tasks
                    collapsedCols={collapsedCols}
                    toggleColumn={toggleColumn}
                    canEditBoard={canEditBoard}
                    onTaskClick={handleTaskClick}
                    onToggleComplete={handleToggleComplete}
                    onQuickAdd={handleQuickAdd}
                  />
                ))}
              </div>
            </div>
          </DragDropContext>
        </div>
      </div>

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
            <Form.Item name="assignee" label="Assign To" rules={[{ required: true }]}>
              <Select placeholder="Select member">
                <Select.Option value="Nguyen Van A">Nguyen Van A</Select.Option>
                <Select.Option value="Tran Thi B">Tran Thi B</Select.Option>
              </Select>
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
      />
    </div>
  );
};

export default Dashboard;
