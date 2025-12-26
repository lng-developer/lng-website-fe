import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Checkbox, Image, Tooltip, Avatar, Button, Input, Tag, Divider, Upload, message } from 'antd';
import {
  CloseOutlined,
  PlusOutlined,
  AlignLeftOutlined,
  CheckOutlined,
  CloseCircleOutlined,
  PaperClipOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { FiEdit } from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';
import { COLUMN_CONFIG } from '../mockData';

const TaskDetailModal = ({ task, open, onClose, columnId, onUpdateTask, onMoveTask }) => {
  const { user } = useAuth();

  // State quản lý chế độ edit
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);

  // State lưu giá trị tạm thời khi đang gõ
  const [descValue, setDescValue] = useState('');
  const [noteValue, setNoteValue] = useState('');

  // Reset state khi mở modal task mới
  useEffect(() => {
    if (task) {
      setDescValue(task.description || '');
      setNoteValue(task.note || '');
      setIsEditingDesc(false);
      setIsEditingNote(false);
    }
  }, [task]);

  // --- SỬA LỖI TẠI ĐÂY: Đưa useMemo lên trước lệnh return null ---
  // Kiểm tra quyền: Admin hoặc Leader mới được sửa
  const canEdit = useMemo(() => ['Admin', 'Leader'].includes(user?.role), [user]);

  // Sau khi gọi hết tất cả các Hooks thì mới được return
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
    message.success('Image added successfully');
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
      {/* ... Phần giao diện giữ nguyên không đổi ... */}
      <div style={{ backgroundColor: headerColor }} className="h-10 w-full pr-2 flex flex-row items-center justify-end group">
        <button onClick={onClose} className="px-2 py-1 hover:bg-black/10 rounded-full text-white transition-colors cursor-pointer z-10">
          <CloseOutlined />
        </button>
      </div>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-3">
        {/* CỘT TRÁI (CHI TIẾT) */}
        <div className="col-span-2 pr-2">
          {/* Title & Checkbox */}
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
            {/* Nút duyệt task */}
            {canEdit && (
              <div className="flex flex-row gap-2">
                <Tooltip title="Accept">
                  <Button type="primary" className="bg-green-600 hover:bg-green-500" icon={<CheckOutlined />} onClick={handleAccept} />
                </Tooltip>
                <Tooltip title="Reject">
                  <Button danger icon={<CloseCircleOutlined />} onClick={handleReject} />
                </Tooltip>
              </div>
            )}
          </div>

          {/* Attachments Section */}
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
                    <Image
                      key={idx}
                      width={120}
                      height={90}
                      src={url}
                      className="object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-90"
                    />
                  ))}
                </div>
              </Image.PreviewGroup>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-6">
              {/* Members & Labels */}
              <div className="flex flex-wrap gap-6">
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Members</h4>
                  <div className="flex gap-2">
                    <Tooltip title={task.assignee}>
                      <Avatar style={{ backgroundColor: '#fde3cf', color: '#f56a00' }}>{task.assignee?.charAt(0)}</Avatar>
                    </Tooltip>
                    {canEdit && <Button shape="circle" icon={<PlusOutlined />} size="small" />}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Labels</h4>
                  <div className="flex gap-2">
                    <Tag color="blue" className="px-3 py-1 text-sm rounded cursor-pointer hover:opacity-80 m-0">
                      {task.tag}
                    </Tag>
                    {canEdit && <Button shape="circle" icon={<PlusOutlined />} size="small" />}
                  </div>
                </div>
              </div>

              {/* DESCRIPTION SECTION */}
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
                        rows={4}
                        value={descValue}
                        onChange={(e) => setDescValue(e.target.value)}
                        placeholder="Add a more detailed description..."
                        autoFocus
                      />
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

              {/* NOTE SECTION */}
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
                        placeholder="Add a note..."
                        autoFocus
                      />
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

        {/* CỘT PHẢI (SIDEBAR & ACTIVITY) */}
        <div className="w-full space-y-6 flex-shrink-0 border-l border-slate-200 pl-4 lg:pl-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlignLeftOutlined className="text-lg text-slate-600" />
                <h3 className="text-base font-semibold text-slate-700">Activity</h3>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <Avatar>{user?.username?.charAt(0) || 'U'}</Avatar>
              <div className="flex-1 bg-white border border-slate-200 rounded-md shadow-sm p-2 hover:shadow-md transition-shadow">
                <Input.TextArea placeholder="Write a comment..." autoSize={{ minRows: 1, maxRows: 4 }} variant="borderless" />
              </div>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {task.comments?.map((cmt, idx) => (
                <div key={idx} className="flex gap-3">
                  <Avatar size="small" style={{ backgroundColor: '#87d068' }}>
                    {cmt.user.charAt(0)}
                  </Avatar>
                  <div>
                    <div className="text-sm">
                      <span className="font-bold text-slate-700 mr-2">{cmt.user}</span>
                      <span className="text-xs text-slate-400">{cmt.time}</span>
                    </div>
                    <div className="text-sm bg-white p-2 rounded shadow-sm border border-slate-100 inline-block mt-1">{cmt.text}</div>
                  </div>
                </div>
              ))}
              <div className="text-xs text-slate-400 italic ml-10">Use Activity to track changes...</div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TaskDetailModal;
