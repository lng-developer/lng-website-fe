import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  Checkbox,
  Image,
  Tooltip,
  Avatar,
  Button,
  Input,
  Tag,
  Divider,
  Upload,
  message,
  Popconfirm,
  Select,
  Alert,
  DatePicker,
} from 'antd';
import {
  CloseOutlined,
  PlusOutlined,
  AlignLeftOutlined,
  CheckOutlined,
  CloseCircleOutlined,
  PaperClipOutlined,
  DeleteOutlined,
  HistoryOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  SettingOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { FiEdit } from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';
import { getColumnConfig } from '../mockData';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const TaskDetailModal = ({
  task,
  open,
  onClose,
  columnId,
  columnTitle,
  columnType,
  onUpdateTask,
  onMoveTask,
  onDeleteTask,
  onToggleComplete, // Nhận thêm prop này
  allMembers = [],
}) => {
  const { user } = useAuth();

  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [descValue, setDescValue] = useState('');
  const [noteValue, setNoteValue] = useState('');
  const [isManagingMembers, setIsManagingMembers] = useState(false);

  // State edit Dates
  const [isEditingDates, setIsEditingDates] = useState(false);
  // State tạm để lưu ngày tháng khi đang chỉnh sửa (Buffer)
  const [tempStartAt, setTempStartAt] = useState(null);
  const [tempDueAt, setTempDueAt] = useState(null);

  useEffect(() => {
    if (task) {
      setTitleValue(task.title || '');
      setDescValue(task.description || '');
      setNoteValue(task.note || '');

      setIsEditingTitle(false);
      setIsEditingDesc(false);
      setIsEditingNote(false);
      setIsManagingMembers(false);
      setIsEditingDates(false);
    }
  }, [task]);

  const canEdit = useMemo(() => ['Admin', 'Leader'].includes(user?.role), [user]);

  if (!task) return null;

  const headerColor = getColumnConfig(columnType)?.headerColor || '#ccc';

  // --- LOGIC THỜI GIAN ---
  const now = dayjs();
  const startDate = task.startAt ? dayjs(task.startAt) : null;
  const dueDate = task.due ? dayjs(task.due).endOf('day') : null;
  const isDone = task.status === 'done' || task.isCompleted;
  const isOverdue = dueDate && now.isAfter(dueDate) && !isDone;

  const handleAccept = () => onMoveTask(task.id, columnId, 'done');
  const handleReject = () => onMoveTask(task.id, columnId, 'rejected');

  const handleSaveTitle = () => {
    if (titleValue.trim() !== task.title) {
      onUpdateTask({ ...task, title: titleValue });
    }
    setIsEditingTitle(false);
  };

  const handleSaveDesc = () => {
    onUpdateTask({ ...task, description: descValue });
    setIsEditingDesc(false);
  };

  const handleSaveNote = () => {
    onUpdateTask({ ...task, note: noteValue });
    setIsEditingNote(false);
  };

  const handleUploadImage = ({ file }) => {
    const imageUrl = URL.createObjectURL(file);
    const newAttachments = [...(task.attachments || []), imageUrl];
    onUpdateTask({ ...task, attachments: newAttachments });
    message.success('Image added');
  };

  const handleDeleteAttachment = (idx) => {
    const newAttachments = task.attachments.filter((_, i) => i !== idx);
    onUpdateTask({ ...task, attachments: newAttachments });
  };

  const handleManageMembers = (newAssignees) => {
    if (newAssignees.includes('ALL')) {
      const allIds = allMembers.map((m) => m._id);
      onUpdateTask({ ...task, assignees: allIds });
      message.success('All members added');
    } else {
      onUpdateTask({ ...task, assignees: newAssignees });
      message.success('Members updated');
    }
    setIsManagingMembers(false);
  };

  const handleChangePriority = (value) => {
    onUpdateTask({ ...task, priority: value });
    message.success('Priority updated');
  };

  // --- LOGIC LƯU NGÀY THÁNG ---
  const startEditingDates = () => {
    if (!canEdit) return;
    // Khởi tạo giá trị tạm từ task hiện tại
    setTempStartAt(task.startAt ? dayjs(task.startAt) : null);
    setTempDueAt(task.due ? dayjs(task.due) : null);
    setIsEditingDates(true);
  };

  const saveDates = () => {
    onUpdateTask({
      ...task,
      startAt: tempStartAt,
      due: tempDueAt,
    });
    setIsEditingDates(false);
    message.success('Dates updated');
  };

  const memberOptions = allMembers.map((m) => ({ label: m.full_name, value: m._id }));
  if (canEdit) {
    memberOptions.unshift({ label: 'Select All Team', value: 'ALL', className: 'font-bold text-blue-600' });
  }

  // Component hiển thị ngày tháng
  const DateDisplay = () => {
    if (isEditingDates) {
      return (
        <div className="flex flex-col gap-1 min-w-[130px] bg-white p-1 rounded border border-blue-200 shadow-sm z-10">
          <DatePicker
            placeholder="Start"
            size="small"
            format="MMM D"
            value={tempStartAt}
            onChange={(d) => setTempStartAt(d)} // Chỉ update biến tạm
            allowClear={false}
            className="w-full"
          />
          <DatePicker
            placeholder="Due"
            size="small"
            format="MMM D"
            value={tempDueAt}
            onChange={(d) => setTempDueAt(d)} // Chỉ update biến tạm
            allowClear={false}
            className="w-full"
          />
          <div className="flex justify-end gap-1 mt-1">
            <Button size="small" type="text" onClick={() => setIsEditingDates(false)} className="text-xs text-slate-400 h-6 px-1">
              Cancel
            </Button>
            <Button size="small" type="primary" onClick={saveDates} className="text-xs h-6 px-2">
              Done
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`flex items-center gap-1.5 px-2 py-1 rounded text-sm font-medium cursor-pointer transition-colors border ${
          isOverdue ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
        }`}
        onClick={startEditingDates}
        title="Click to edit dates"
      >
        <ClockCircleOutlined />
        <div className="flex flex-col text-[11px] leading-3">
          <span>
            {startDate ? startDate.format('MMM D') : '...'} - {dueDate ? dueDate.format('MMM D') : '...'}
          </span>
          {isOverdue && <span className="text-[9px] font-bold">OVERDUE</span>}
        </div>
      </div>
    );
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      closeIcon={null}
      styles={{ content: { padding: 0, overflow: 'hidden', borderRadius: '12px' } }}
    >
      <div style={{ backgroundColor: headerColor }} className="h-10 w-full pr-2 flex flex-row items-center justify-end group">
        <button onClick={onClose} className="px-2 py-1 hover:bg-black/10 rounded-full text-white transition-colors cursor-pointer z-10">
          <CloseOutlined />
        </button>
      </div>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-3">
        <div className="col-span-2 pr-2">
          {isOverdue && (
            <div className="mb-4">
              <Alert
                message="Overdue Task"
                description={`This task was due ${dueDate.fromNow()}. Please prioritize it!`}
                type="error"
                showIcon
                banner
                className="rounded-md border-red-200"
              />
            </div>
          )}

          <div className="flex gap-4 mb-4 items-start">
            <div className="mt-1">
              {/* SỬA CHECKBOX: GỌI onToggleComplete */}
              <Checkbox checked={task.isCompleted} onChange={(e) => onToggleComplete(task.id, columnId, e.target.checked)} />
            </div>

            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div className="flex-1 mr-4">
                  {isEditingTitle ? (
                    <Input.TextArea
                      value={titleValue}
                      onChange={(e) => setTitleValue(e.target.value)}
                      onBlur={handleSaveTitle}
                      autoFocus
                      autoSize={{ minRows: 1, maxRows: 3 }}
                      className="text-xl font-bold text-slate-800 mb-1 leading-tight resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSaveTitle();
                        }
                      }}
                    />
                  ) : (
                    <h2
                      className={`text-xl font-bold text-slate-800 mb-1 leading-tight group flex items-center gap-2 ${
                        task.isCompleted ? 'line-through text-slate-400' : ''
                      }`}
                      onClick={() => canEdit && setIsEditingTitle(true)}
                    >
                      {task.title}
                      {canEdit && (
                        <EditOutlined className="text-sm text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
                      )}
                    </h2>
                  )}
                  <p className="text-sm text-slate-500">
                    in list <span className="underline decoration-1 cursor-pointer font-medium text-slate-700">{columnTitle}</span>
                  </p>
                </div>

                <DateDisplay />
              </div>
            </div>
          </div>

          {/* ... (Phần Attachments, Members, Description, Note ... giữ nguyên không đổi) ... */}

          {(task.attachments?.length > 0 || canEdit) && (
            <div className="mb-6 ml-9">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xs font-semibold text-slate-500 uppercase">Attachments</h3>
                {canEdit && (
                  <Upload showUploadList={false} beforeUpload={() => false} onChange={handleUploadImage} maxCount={1}>
                    <Tooltip title="Add image">
                      <Button size="small" type="dashed" icon={<PlusOutlined />} className="flex items-center justify-center h-6 w-6" />
                    </Tooltip>
                  </Upload>
                )}
              </div>
              <Image.PreviewGroup>
                <div className="flex gap-4 flex-wrap">
                  {task.attachments?.map((url, idx) => (
                    <div key={idx} className="relative group">
                      <Image width={120} height={90} src={url} className="object-cover rounded-lg border border-slate-200" />
                      {canEdit && (
                        <Popconfirm title="Delete image?" onConfirm={() => handleDeleteAttachment(idx)} okText="Yes" cancelText="No">
                          <div className="absolute top-1 right-1 bg-white/80 hover:bg-white text-red-500 rounded-full w-5 h-5 flex items-center justify-center cursor-pointer shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <CloseOutlined style={{ fontSize: '10px' }} />
                          </div>
                        </Popconfirm>
                      )}
                    </div>
                  ))}
                </div>
              </Image.PreviewGroup>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-6">
              <div className="flex flex-wrap gap-6">
                {/* <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Labels</h4>
                  <div className="flex gap-2">
                    <Tag color="blue" className="px-3 py-1 text-sm rounded cursor-pointer hover:opacity-80 m-0">
                      {task.tag}
                    </Tag>
                  </div>
                </div> */}

                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Priority</h4>
                  <Select
                    size="small"
                    value={task.priority}
                    onChange={handleChangePriority}
                    disabled={!canEdit}
                    style={{ width: 106 }}
                    bordered={false}
                    className="font-medium"
                  >
                    <Select.Option value="high">
                      <Tag color="red" className="mr-0">
                        High
                      </Tag>
                    </Select.Option>
                    <Select.Option value="medium">
                      <Tag color="orange" className="mr-0">
                        Medium
                      </Tag>
                    </Select.Option>
                    <Select.Option value="low">
                      <Tag color="green" className="mr-0">
                        Low
                      </Tag>
                    </Select.Option>
                  </Select>
                </div>

                <div>
                  <div className="flex items-center gap-2 ">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase m-0">Members</h4>
                    {canEdit && !isManagingMembers && (
                      <Tooltip title="Manage members">
                        <SettingOutlined
                          className="text-slate-400 hover:text-blue-600 cursor-pointer"
                          onClick={() => setIsManagingMembers(true)}
                        />
                      </Tooltip>
                    )}
                  </div>

                  {isManagingMembers ? (
                    <Select
                      mode="multiple"
                      autoFocus
                      style={{ width: '200px' }}
                      placeholder="Select members"
                      defaultValue={task.assignees}
                      onChange={handleManageMembers}
                      onBlur={() => setIsManagingMembers(false)}
                      options={memberOptions}
                      maxTagCount="responsive"
                    />
                  ) : (
                    <div className="flex gap-2 items-center">
                      <Avatar.Group maxCount={5}>
                        {task.assignees?.map((userId, idx) => {
                          const member = allMembers.find((u) => u._id === userId);
                          const name = member?.full_name || 'Unknown';
                          return (
                            <Tooltip title={name} key={idx}>
                              <Avatar style={{ backgroundColor: '#fde3cf', color: '#f56a00' }}>{name.charAt(0)}</Avatar>
                            </Tooltip>
                          );
                        })}
                      </Avatar.Group>
                      {canEdit && (
                        <Tooltip title="Quick add">
                          <Button shape="circle" icon={<PlusOutlined />} size="small" onClick={() => setIsManagingMembers(true)} />
                        </Tooltip>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <AlignLeftOutlined className="text-lg text-slate-600" />
                  <h3 className="text-base font-semibold text-slate-700">Description</h3>
                  {canEdit && !isEditingDesc && (
                    <Tooltip title="Edit">
                      <FiEdit
                        size={14}
                        className="cursor-pointer text-slate-500 hover:text-slate-800"
                        onClick={() => setIsEditingDesc(true)}
                      />
                    </Tooltip>
                  )}
                </div>
                <div className="ml-8">
                  {isEditingDesc ? (
                    <div className="space-y-2">
                      <Input.TextArea
                        rows={10}
                        value={descValue}
                        onChange={(e) => setDescValue(e.target.value)}
                        autoFocus
                        onBlur={handleSaveDesc}
                      />
                      <div className="flex gap-1 mt-2">
                        <Button type="primary" size="small" onClick={handleSaveDesc} onMouseDown={(e) => e.preventDefault()}>
                          Save
                        </Button>
                        <Button
                          size="small"
                          onClick={() => {
                            setIsEditingDesc(false);
                            setDescValue(task.description);
                          }}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => canEdit && setIsEditingDesc(true)}
                      className={`text-slate-700 text-sm whitespace-pre-line min-h-[40px] max-h-[300px] overflow-y-auto ${
                        canEdit ? 'cursor-pointer hover:bg-slate-100 p-2 -ml-2 rounded transition-colors' : ''
                      }`}
                    >
                      {task.description || <span className="text-slate-400 italic">No description provided.</span>}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <PaperClipOutlined className="text-lg text-slate-600" />
                  <h3 className="text-base font-semibold text-slate-700">Note</h3>
                  {canEdit && !isEditingNote && (
                    <Tooltip title="Edit">
                      <FiEdit
                        size={14}
                        className="cursor-pointer text-slate-500 hover:text-slate-800"
                        onClick={() => setIsEditingNote(true)}
                      />
                    </Tooltip>
                  )}
                </div>
                <div className="ml-8">
                  {isEditingNote ? (
                    <div className="space-y-2">
                      <Input.TextArea
                        rows={3}
                        value={noteValue}
                        onChange={(e) => setNoteValue(e.target.value)}
                        autoFocus
                        onBlur={handleSaveNote}
                      />
                      <div className="flex gap-2">
                        <Button type="primary" size="small" onClick={handleSaveNote} onMouseDown={(e) => e.preventDefault()}>
                          Save
                        </Button>
                        <Button
                          size="small"
                          onClick={() => {
                            setIsEditingNote(false);
                            setNoteValue(task.note);
                          }}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => canEdit && setIsEditingNote(true)}
                      className={`text-slate-700 text-sm whitespace-pre-line min-h-[40px] ${
                        canEdit ? 'cursor-pointer hover:bg-slate-100 p-2 -ml-2 rounded transition-colors' : ''
                      }`}
                    >
                      {task.note || <span className="text-slate-400 italic">No notes added.</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full space-y-6 flex-shrink-0 border-l border-slate-200 pl-4 lg:pl-6">
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Actions</h4>
            {canEdit && (
              <Popconfirm
                title="Delete the task"
                description="Are you sure?"
                onConfirm={() => onDeleteTask(task.id, columnId)}
                okText="Yes"
                cancelText="No"
              >
                <Button block danger icon={<DeleteOutlined />} className="text-left justify-start">
                  Delete Task
                </Button>
              </Popconfirm>
            )}
          </div>
          <Divider />
          <div>
            <div className="flex items-center gap-2 mb-4">
              <HistoryOutlined className="text-lg text-slate-600" />
              <h3 className="text-base font-semibold text-slate-700">Activity</h3>
            </div>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {task.activities?.length > 0 ? (
                task.activities.map((act, idx) => (
                  <div key={idx} className="flex gap-3 text-sm">
                    <Avatar size="small" style={{ backgroundColor: '#ccc' }}>
                      U
                    </Avatar>
                    <div>
                      <div>
                        <span className="font-bold text-slate-700 mr-1">{user?.full_name || 'System'}</span>
                        <span className="text-slate-600">{act.type}</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        {act.time ? dayjs(act.time).format('MMM D, YYYY h:mm A') : dayjs().format('MMM D, YYYY h:mm A')}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 italic">No activity recorded.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TaskDetailModal;
