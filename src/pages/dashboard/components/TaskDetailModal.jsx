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
  Popover,
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
  LinkOutlined,
  FileImageOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { FiEdit } from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';
import { getColumnConfig } from '../mockData';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { uploadIssueAttachment } from '../../../apis/dashboard';

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
  onToggleComplete,
  allMembers = [],
}) => {
  const { user } = useAuth();

  const [titleValue, setTitleValue] = useState('');
  const [descValue, setDescValue] = useState('');
  const [noteValue, setNoteValue] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isManagingMembers, setIsManagingMembers] = useState(false);
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [tempStartAt, setTempStartAt] = useState(null);
  const [tempDueAt, setTempDueAt] = useState(null);
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');
  const [uploading, setUploading] = useState(false);

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
      setIsLinkPopoverOpen(false);
    }
  }, [task]);

  const canEdit = useMemo(() => ['Admin', 'Leader', 'Seller'].includes(user?.role?.name || user?.role), [user]);

  if (!task) return null;
  const headerColor = getColumnConfig(columnType)?.headerColor || '#ccc';

  const isImageAttachment = (att) => {
    if (att.mime && att.mime.startsWith('image/')) return true;
    if (typeof att.url === 'string') return /\.(jpeg|jpg|gif|png|webp|bmp|svg)$/i.test(att.url);
    return false;
  };

  const handleUploadFile = async ({ file }) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('files', file);
      const res = await uploadIssueAttachment(task.projectId || task.project_id, task.id, formData);

      if (res.data?.data) {
        const updated = res.data.data;
        const mappedTask = {
          ...task,
          ...updated,
          id: updated._id,
          assignees: updated.assigneeIds || [],
          activities: updated.activity || [],
          attachments: updated.attachments || [],
          isUploadFile: true,
        };
        onUpdateTask(mappedTask);
        message.success('File uploaded');
      }
    } catch (error) {
      message.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handlePaste = (e) => {
    if (uploading) return;
    const items = e.clipboardData.items;
    let fileToUpload = null;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        fileToUpload = items[i].getAsFile();
        break;
      }
    }
    if (fileToUpload) {
      e.preventDefault();
      e.stopPropagation();
      handleUploadFile({ file: fileToUpload });
    }
  };

  const handleAddLink = () => {
    if (!linkUrl) return;
    const newLinkObj = { name: linkName || linkUrl, url: linkUrl, type: 'link' };
    onUpdateTask({ ...task, newLinkAttachment: newLinkObj });
    setLinkUrl('');
    setLinkName('');
    setIsLinkPopoverOpen(false);
  };

  const handleDeleteAttachment = (idx) => {
    const newAttachments = task.attachments.filter((_, i) => i !== idx);
    onUpdateTask({ ...task, attachments: newAttachments });
  };

  const handleAccept = () => onMoveTask(task.id, columnId, 'done');
  const handleReject = () => onMoveTask(task.id, columnId, 'rejected');
  const handleSaveTitle = () => {
    if (titleValue.trim() !== task.title) onUpdateTask({ ...task, title: titleValue });
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

  const handleManageMembers = (newAssignees) => {
    const ids = newAssignees.includes('ALL') ? allMembers.map((m) => m._id) : newAssignees;
    onUpdateTask({ ...task, assignees: ids });
    setIsManagingMembers(false);
  };
  const handleChangePriority = (value) => onUpdateTask({ ...task, priority: value });
  const startEditingDates = () => {
    if (canEdit) {
      setTempStartAt(task.startAt ? dayjs(task.startAt) : null);
      setTempDueAt(task.due ? dayjs(task.due) : null);
      setIsEditingDates(true);
    }
  };
  const saveDates = () => {
    onUpdateTask({ ...task, startAt: tempStartAt, due: tempDueAt });
    setIsEditingDates(false);
    message.success('Dates updated');
  };

  const AttachmentItem = ({ att, index }) => {
    const isImg = isImageAttachment(att);
    return (
      <div className="relative group border border-slate-200 rounded-lg overflow-hidden w-[120px] h-[90px] bg-slate-50 hover:bg-slate-100 transition-colors">
        {isImg ? (
          <Image
            width={120}
            height={90}
            src={att.url}
            className="object-cover"
            preview={{ mask: <div className="text-xs text-white">View</div> }}
          />
        ) : (
          <a
            href={att.url}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center justify-center p-2 w-full h-full text-slate-500 hover:text-blue-600 no-underline"
            title={att.url}
          >
            <GlobalOutlined className="text-xl mb-1 opacity-70" />
            <span className="text-[10px] text-center w-full truncate px-1 font-medium">{att.name || 'Link'}</span>
          </a>
        )}
        {canEdit && (
          <Popconfirm title="Remove?" onConfirm={() => handleDeleteAttachment(index)} okText="Yes" cancelText="No">
            <div className="absolute top-1 right-1 bg-white/90 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full w-5 h-5 flex items-center justify-center cursor-pointer shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10 border border-slate-200">
              <CloseOutlined style={{ fontSize: '10px' }} />
            </div>
          </Popconfirm>
        )}
      </div>
    );
  };

  const DateDisplay = () => {
    if (isEditingDates) {
      return (
        <div className="flex flex-col gap-1 min-w-[140px] bg-white p-2 rounded-lg border border-blue-200 shadow-xl z-50 absolute top-8 right-0 animate-fade-in">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Start Date</div>
          <DatePicker
            size="small"
            format="MMM D, YYYY"
            value={tempStartAt}
            onChange={setTempStartAt}
            allowClear={false}
            className="w-full"
          />
          <div className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-wider">Due Date</div>
          <DatePicker size="small" format="MMM D, YYYY" value={tempDueAt} onChange={setTempDueAt} allowClear={false} className="w-full" />
          <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-slate-100">
            <Button size="small" onClick={() => setIsEditingDates(false)} className="text-xs">
              Cancel
            </Button>
            <Button size="small" type="primary" onClick={saveDates} className="text-xs">
              Done
            </Button>
          </div>
        </div>
      );
    }
    const now = dayjs();
    const startDate = task.startAt ? dayjs(task.startAt) : null;
    const dueDate = task.due ? dayjs(task.due).endOf('day') : null;
    const isOverdue = dueDate && now.isAfter(dueDate) && !task.isCompleted;

    return (
      <div
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm font-medium cursor-pointer transition-all border ${
          isOverdue
            ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
            : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
        }`}
        onClick={startEditingDates}
      >
        <ClockCircleOutlined className={isOverdue ? 'text-red-500' : 'text-slate-400'} />
        <div className="flex flex-col text-[11px] leading-3">
          <span>
            {startDate ? startDate.format('MMM D') : '...'} - {dueDate ? dueDate.format('MMM D') : '...'}
          </span>
          {isOverdue && <span className="text-[9px] font-bold text-red-600 mt-0.5">OVERDUE</span>}
        </div>
      </div>
    );
  };

  const memberOptions = allMembers.map((m) => ({ label: m.full_name, value: m._id }));
  if (canEdit) memberOptions.unshift({ label: 'Select All Team', value: 'ALL', className: 'font-bold text-blue-600' });

  const linkContent = (
    <div className="flex flex-col gap-2 w-64">
      <Input
        placeholder="Paste URL..."
        value={linkUrl}
        onChange={(e) => setLinkUrl(e.target.value)}
        size="small"
        prefix={<LinkOutlined className="text-slate-400" />}
      />
      <Input placeholder="Name (Optional)" value={linkName} onChange={(e) => setLinkName(e.target.value)} size="small" />
      <Button type="primary" size="small" onClick={handleAddLink} disabled={!linkUrl} block>
        Attach Link
      </Button>
    </div>
  );

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      closeIcon={null}
      styles={{ content: { padding: 0, paddingBottom: '15px', overflow: 'visible', borderRadius: '12px', maxHeight: '750px' } }}
      wrapProps={{ onPaste: handlePaste }}
    >
      <div style={{ backgroundColor: headerColor }} className="h-10 w-full pr-2 flex flex-row items-center justify-end rounded-t-xl">
        <button onClick={onClose} className="px-2 py-1 hover:bg-black/10 rounded-full text-white transition-colors cursor-pointer z-10">
          <CloseOutlined />
        </button>
      </div>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-3 max-h-[700px] overflow-y-auto custom-scrollbar">
        <div className="col-span-2 pr-2">
          {/* Header Title + Checkbox + Date */}
          <div className="flex gap-3 mb-5 items-start relative">
            <div className="mt-1.5">
              <Checkbox checked={task.isCompleted} onChange={(e) => onToggleComplete(task.id, columnId, e.target.checked)} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
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
                      {task.title}{' '}
                      {canEdit && (
                        <EditOutlined className="text-sm text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
                      )}
                    </h2>
                  )}
                  <p className="text-sm text-slate-500">
                    in list <span className="underline decoration-1 cursor-pointer font-medium text-slate-700">{columnTitle}</span>
                  </p>
                </div>
                <div className="relative pt-1">
                  <DateDisplay />
                </div>
              </div>
            </div>
          </div>

          {(task.attachments?.length > 0 || canEdit) && (
            <div className="mb-6 ml-9">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-slate-700">
                  <PaperClipOutlined />
                  <h3 className="text-sm font-semibold m-0">Attachments</h3>
                </div>
                {canEdit && (
                  <div className="flex gap-2">
                    <Upload showUploadList={false} beforeUpload={() => false} onChange={handleUploadFile} maxCount={1} disabled={uploading}>
                      <Button size="small" icon={<FileImageOutlined />} loading={uploading} className="text-xs">
                        File
                      </Button>
                    </Upload>
                    <Popover
                      content={linkContent}
                      title="Add Link"
                      trigger="click"
                      open={isLinkPopoverOpen}
                      onOpenChange={setIsLinkPopoverOpen}
                      placement="bottomRight"
                    >
                      <Button size="small" icon={<LinkOutlined />} className="text-xs">
                        Link
                      </Button>
                    </Popover>
                  </div>
                )}
              </div>
              <div className="flex gap-3 flex-wrap max-h-48 overflow-y-auto">
                {task.attachments?.map((att, idx) => (
                  <AttachmentItem key={idx} att={att} index={idx} />
                ))}
                {task.attachments?.length === 0 && <span className="text-xs text-slate-400 italic">No attachments.</span>}
              </div>
            </div>
          )}

          {/* Meta Fields */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-5 ml-9">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                Members{' '}
                {canEdit && !isManagingMembers && (
                  <SettingOutlined className="cursor-pointer hover:text-blue-500" onClick={() => setIsManagingMembers(true)} />
                )}
              </div>
              {isManagingMembers ? (
                <Select
                  mode="multiple"
                  autoFocus
                  style={{ width: '100%' }}
                  placeholder="Members"
                  defaultValue={task.assignees.map((u) => (typeof u === 'object' ? u._id : u))}
                  onChange={handleManageMembers}
                  onBlur={() => setIsManagingMembers(false)}
                  options={memberOptions}
                  maxTagCount="responsive"
                  size="small"
                />
              ) : (
                <div className="flex gap-1 items-center flex-wrap">
                  <Avatar.Group maxCount={3} size="small">
                    {/* [UPDATED] Check object or ID */}
                    {task.assignees?.map((userOrId, idx) => {
                      let member = userOrId;
                      if (typeof userOrId !== 'object') member = allMembers.find((u) => u._id === userOrId);
                      const name = member?.full_name || 'Unknown';
                      return (
                        <Tooltip title={name} key={idx}>
                          <Avatar style={{ backgroundColor: '#fde3cf', color: '#f56a00' }}>{name.charAt(0)}</Avatar>
                        </Tooltip>
                      );
                    })}
                  </Avatar.Group>
                  {canEdit && (
                    <Button
                      shape="circle"
                      icon={<PlusOutlined />}
                      size="small"
                      onClick={() => setIsManagingMembers(true)}
                      className="flex items-center justify-center text-slate-400 border-dashed"
                    />
                  )}
                </div>
              )}
            </div>
            {/* <div>
              <div className="text-xs font-semibold text-slate-500 uppercase mb-1.5">Label</div>
              <Tag color="blue" className="px-2 py-0.5 text-xs rounded m-0">
                {task.tag || 'None'}
              </Tag>
            </div> */}
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase mb-1.5">Priority</div>
              <Select
                size="small"
                value={task.priority}
                onChange={handleChangePriority}
                disabled={!canEdit}
                style={{ maxWidth: '170px' }}
                bordered={false}
                className="font-medium -ml-2"
              >
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
            </div>
          </div>

          <div className="mb-6 ml-9">
            <div className="flex items-center gap-2 mb-1.5 text-slate-700">
              <AlignLeftOutlined />
              <h3 className="text-sm font-semibold m-0">Description</h3>
              {canEdit && !isEditingDesc && (
                <FiEdit className="cursor-pointer text-slate-400 hover:text-slate-600 ml-1" onClick={() => setIsEditingDesc(true)} />
              )}
            </div>
            {isEditingDesc ? (
              <div>
                <Input.TextArea
                  showCount
                  maxLength={1000}
                  autoSize={{ minRows: 3, maxRows: 10 }}
                  value={descValue}
                  onChange={(e) => setDescValue(e.target.value)}
                  autoFocus
                  onBlur={handleSaveDesc}
                  className="mb-2"
                />
                <div className="flex gap-2">
                  <Button type="primary" size="small" onMouseDown={(e) => e.preventDefault()} onClick={handleSaveDesc}>
                    Save
                  </Button>
                  <Button
                    size="small"
                    onMouseDown={(e) => e.preventDefault()}
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
                className={`text-sm text-slate-600 whitespace-pre-line min-h-[40px] max-h-[270px] overflow-y-auto ${
                  canEdit ? 'cursor-pointer hover:bg-slate-50 p-2 -ml-2 rounded' : ''
                }`}
              >
                {task.description || <span className="italic text-slate-400">Add a description...</span>}
              </div>
            )}
          </div>

          {/* <div className="mb-6 ml-9">
            <div className="flex items-center gap-2 mb-1.5 text-slate-700">
              <PaperClipOutlined />
              <h3 className="text-sm font-semibold m-0">Note</h3>
              {canEdit && !isEditingNote && (
                <FiEdit className="cursor-pointer text-slate-400 hover:text-slate-600 ml-1" onClick={() => setIsEditingNote(true)} />
              )}
            </div>
            {isEditingNote ? (
              <div>
                <Input.TextArea
                  rows={2}
                  value={noteValue}
                  onChange={(e) => setNoteValue(e.target.value)}
                  autoFocus
                  onBlur={handleSaveNote}
                  className="mb-2"
                />
                <div className="flex gap-2">
                  <Button type="primary" size="small" onMouseDown={(e) => e.preventDefault()} onClick={handleSaveNote}>
                    Save
                  </Button>
                  <Button
                    size="small"
                    onMouseDown={(e) => e.preventDefault()}
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
                className={`text-sm text-slate-600 whitespace-pre-line min-h-[30px] ${
                  canEdit ? 'cursor-pointer hover:bg-slate-50 p-2 -ml-2 rounded' : ''
                }`}
              >
                {task.note || <span className="italic text-slate-400">Add a note...</span>}
              </div>
            )}
          </div> */}
        </div>

        {/* Right Column */}
        <div className="w-full space-y-6 flex-shrink-0 border-l border-slate-200 pl-4 lg:pl-6">
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Actions</h4>
            {canEdit && (
              <Popconfirm title="Delete task?" onConfirm={() => onDeleteTask(task.id, columnId)} okText="Yes" cancelText="No">
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
              <h3 className="text-base font-semibold text-slate-700 m-0">Activity</h3>
            </div>
            <div className="space-y-4 max-h-[470px] overflow-y-auto pr-2 custom-scrollbar">
              {task.activities?.length > 0 ? (
                task.activities
                  .slice()
                  .reverse()
                  .map((act, idx) => {
                    // [UPDATED] Check logic hiển thị user
                    let userName = 'System';
                    if (act.user && act.user.full_name) {
                      userName = act.user.full_name;
                    } else if (act.userId) {
                      const u = allMembers.find((m) => m._id === act.userId);
                      if (u) userName = u.full_name;
                    }

                    const timeStr = act.createdAt
                      ? dayjs(act.createdAt).format('MMM D, h:mm A')
                      : act.at
                      ? dayjs(act.at).format('MMM D, h:mm A')
                      : '';

                    return (
                      <div key={idx} className="flex gap-3 text-sm">
                        <Avatar size="small" style={{ backgroundColor: '#e2e8f0', color: '#64748b' }}>
                          {userName.charAt(0)}
                        </Avatar>
                        <div>
                          <div>
                            <span className="font-bold text-slate-700 mr-1">{userName}</span>
                            <span className="text-slate-600 text-xs">
                              {act.type === 'created'
                                ? 'created task'
                                : act.type === 'updated'
                                ? 'updated task'
                                : act.type === 'issue_moved'
                                ? 'moved task'
                                : act.type === 'attachment_added'
                                ? 'added attachment'
                                : act.type === 'commented'
                                ? 'commented'
                                : act.type}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">{timeStr}</div>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="text-xs text-slate-400 italic">No activity.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TaskDetailModal;
