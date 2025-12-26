import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Checkbox, Image, Tooltip, Avatar, Button, Input, Tag, Divider, Upload, message, Popconfirm, Select } from 'antd';
import {
  CloseOutlined,
  PlusOutlined,
  AlignLeftOutlined,
  CheckOutlined,
  CloseCircleOutlined,
  PaperClipOutlined,
  DeleteOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { FiEdit } from 'react-icons/fi';
import { MdOutlineDelete } from 'react-icons/md';
import { useAuth } from '../../../context/AuthContext';
import { COLUMN_CONFIG, ALL_MEMBERS } from '../mockData';

const TaskDetailModal = ({ task, open, onClose, columnId, onUpdateTask, onMoveTask, onDeleteTask }) => {
  const { user } = useAuth();

  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [descValue, setDescValue] = useState('');
  const [noteValue, setNoteValue] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);

  useEffect(() => {
    if (task) {
      setDescValue(task.description || '');
      setNoteValue(task.note || '');
      setIsEditingDesc(false);
      setIsEditingNote(false);
      setIsAddingMember(false);
    }
  }, [task]);

  const canEdit = useMemo(() => ['Admin', 'Leader'].includes(user?.role), [user]);

  if (!task) return null;

  const headerColor = COLUMN_CONFIG[columnId]?.headerColor || '#ccc';

  // --- HANDLERS ---
  const handleAccept = () => onMoveTask(task.id, columnId, 'done');
  const handleReject = () => onMoveTask(task.id, columnId, 'rejected');

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

  // Yêu cầu 3: Xóa attachment
  const handleDeleteAttachment = (indexToRemove) => {
    const newAttachments = task.attachments.filter((_, index) => index !== indexToRemove);
    onUpdateTask({ ...task, attachments: newAttachments });
    message.success('Attachment deleted');
  };

  // Yêu cầu 1: Thêm logic "Select All" cho Leader/Admin
  const handleAddMember = (value) => {
    if (value === 'ALL') {
      // Gộp tất cả thành viên, loại bỏ trùng lặp
      const mergedMembers = Array.from(new Set([...task.assignees, ...ALL_MEMBERS]));
      onUpdateTask({ ...task, assignees: mergedMembers });
      message.success('All members added');
    } else {
      if (task.assignees.includes(value)) {
        message.warning('Member already assigned');
        return;
      }
      const newAssignees = [...task.assignees, value];
      onUpdateTask({ ...task, assignees: newAssignees });
      message.success(`Added ${value}`);
    }
    setIsAddingMember(false);
  };

  // Tạo option cho Select thêm thành viên
  const memberOptions = ALL_MEMBERS.map((m) => ({ label: m, value: m }));
  if (canEdit) {
    memberOptions.unshift({ label: 'Select All Team', value: 'ALL', className: 'font-bold text-blue-600' });
  }

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
        {/* CỘT TRÁI */}
        <div className="col-span-2 pr-2">
          <div className="flex gap-4 mb-4">
            <div className="mt-1">
              <Checkbox checked={task.isCompleted} onChange={(e) => onUpdateTask({ ...task, isCompleted: e.target.checked })} />
            </div>
            <div className="flex-1">
              <h2
                className={`text-xl font-bold text-slate-800 mb-1 leading-tight ${task.isCompleted ? 'line-through text-slate-400' : ''}`}
              >
                {task.title}
              </h2>
              <p className="text-sm text-slate-500">
                in list{' '}
                <span className="underline decoration-1 cursor-pointer font-medium text-slate-700">{COLUMN_CONFIG[columnId]?.title}</span>
              </p>
            </div>
            {canEdit && (
              <div className="flex flex-row gap-2">
                <Popconfirm
                  title="Delete the task"
                  description="Are you sure to delete this task?"
                  onConfirm={() => onDeleteTask(task.id, columnId)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Tooltip title={' Delete Task'}>
                    <button className="flex items-center justify-center cursor-pointer  border-1 rounded-md h-[32px] w-[32px] bg-red-400 border-red-500 text-red-200 hover:opacity-85">
                      <MdOutlineDelete size={20} color="white" />
                    </button>
                  </Tooltip>
                </Popconfirm>

                <Tooltip title="Accept">
                  <Button type="primary" className="bg-green-600 hover:bg-green-500" icon={<CheckOutlined />} onClick={handleAccept} />
                </Tooltip>
                <Tooltip title="Reject">
                  <Button icon={<CloseCircleOutlined />} onClick={handleReject} />
                </Tooltip>
              </div>
            )}
          </div>

          {/* Attachments (Cập nhật giao diện xóa) */}
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
                      {/* Nút xóa attachment */}
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
              {/* Members */}
              <div className="flex flex-wrap gap-6">
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Members</h4>
                  <div className="flex gap-2 items-center">
                    <Avatar.Group maxCount={5}>
                      {task.assignees?.map((member, idx) => (
                        <Tooltip title={member} key={idx}>
                          <Avatar style={{ backgroundColor: '#fde3cf', color: '#f56a00' }}>{member.charAt(0)}</Avatar>
                        </Tooltip>
                      ))}
                    </Avatar.Group>

                    {canEdit && (
                      <div className="relative">
                        {!isAddingMember ? (
                          <Button shape="circle" icon={<PlusOutlined />} size="small" onClick={() => setIsAddingMember(true)} />
                        ) : (
                          <Select
                            autoFocus
                            style={{ width: 160 }}
                            size="small"
                            placeholder="Select member"
                            onSelect={handleAddMember}
                            onBlur={() => setIsAddingMember(false)}
                            options={memberOptions}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Labels</h4>
                  <div className="flex gap-2">
                    <Tag color="blue" className="px-3 py-1 text-sm rounded cursor-pointer hover:opacity-80 m-0">
                      {task.tag}
                    </Tag>
                  </div>
                </div>
              </div>

              {/* Description & Notes (Giữ nguyên) */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <AlignLeftOutlined className="text-lg text-slate-600" />
                  <h3 className="text-base font-semibold text-slate-700">Description</h3>
                  {canEdit && !isEditingDesc && (
                    <Tooltip title="Edit">
                      <FiEdit
                        size={14}
                        className="cursor-pointer text-slate-500 hover:text-slate-800 mb-2"
                        onClick={() => setIsEditingDesc(true)}
                      />
                    </Tooltip>
                  )}
                </div>
                <div className="ml-8">
                  {isEditingDesc ? (
                    <div className="space-y-2">
                      <Input.TextArea rows={4} value={descValue} onChange={(e) => setDescValue(e.target.value)} autoFocus />
                      <div className="flex gap-2">
                        <Button type="primary" size="small" onClick={handleSaveDesc}>
                          Save
                        </Button>
                        <Button
                          size="small"
                          onClick={() => {
                            setIsEditingDesc(false);
                            setDescValue(task.description);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => canEdit && setIsEditingDesc(true)}
                      className={`text-slate-700 text-sm whitespace-pre-line min-h-[40px] ${
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
                        className="cursor-pointer text-slate-500 hover:text-slate-800 mb-2"
                        onClick={() => setIsEditingNote(true)}
                      />
                    </Tooltip>
                  )}
                </div>
                <div className="ml-8">
                  {isEditingNote ? (
                    <div className="space-y-2">
                      <Input.TextArea rows={3} value={noteValue} onChange={(e) => setNoteValue(e.target.value)} autoFocus />
                      <div className="flex gap-2">
                        <Button type="primary" size="small" onClick={handleSaveNote}>
                          Save
                        </Button>
                        <Button
                          size="small"
                          onClick={() => {
                            setIsEditingNote(false);
                            setNoteValue(task.note);
                          }}
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

        {/* CỘT PHẢI (SIDEBAR) */}
        <div className="w-full space-y-6 flex-shrink-0 border-l border-slate-200 pl-4 lg:pl-6">
          {/* <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Actions</h4>
            {canEdit && (
              <Popconfirm
                title="Delete the task"
                description="Are you sure to delete this task?"
                onConfirm={() => onDeleteTask(task.id, columnId)}
                okText="Yes"
                cancelText="No"
              >
                <Tooltip title={' Delete Task'}>
                  <Button block danger icon={<DeleteOutlined />} className="text-left justify-start"></Button>
                </Tooltip>
              </Popconfirm>
            )}
          </div> */}

          {/* <Divider /> */}

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
                      {act.user.charAt(0)}
                    </Avatar>
                    <div>
                      <div>
                        <span className="font-bold text-slate-700 mr-1">{act.user}</span>
                        <span className="text-slate-600">{act.action}</span>
                      </div>
                      <div className="text-xs text-slate-400">{act.time}</div>
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
