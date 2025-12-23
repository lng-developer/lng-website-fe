import React from 'react';
import { Modal, Checkbox, Image, Tooltip, Avatar, Button, Input, Tag, Divider } from 'antd';
import { CloseOutlined, PlusOutlined, AlignLeftOutlined, CheckOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { FaEdit } from 'react-icons/fa';
import { COLUMN_CONFIG } from '../mockData';

const TaskDetailModal = ({ task, open, onClose, columnId, onUpdateTask, onMoveTask }) => {
  if (!task) return null;
  const headerColor = COLUMN_CONFIG[columnId]?.headerColor || '#ccc';

  const handleAccept = () => onMoveTask(task.id, columnId, 'done');
  const handleReject = () => onMoveTask(task.id, columnId, 'rejected');

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
        <button onClick={onClose} className="px-2 py-1  hover:bg-black/10 rounded-full text-white transition-colors cursor-pointer z-10">
          <CloseOutlined />
        </button>
      </div>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-3">
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
            <div className="flex flex-row gap-2 ">
              <Tooltip title={'Accept'}>
                <Button
                  type="primary"
                  className="bg-green-600 hover:bg-green-500 "
                  icon={<CheckOutlined />}
                  onClick={handleAccept}
                ></Button>
              </Tooltip>
              <Tooltip title={'Reject'}>
                <Button danger icon={<CloseCircleOutlined />} onClick={handleReject}></Button>
              </Tooltip>
            </div>
          </div>

          {task.attachments && task.attachments.length > 0 && (
            <div className="mb-6 ml-9">
              <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Attachments</h3>
              <Image.PreviewGroup>
                <div className="flex gap-4 flex-wrap">
                  {task.attachments.map((url, idx) => (
                    <Image
                      key={idx}
                      width={150}
                      height={120}
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
              <div className="flex flex-wrap gap-6">
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Members</h4>
                  <div className="flex gap-2">
                    <Tooltip title={task.assignee}>
                      <Avatar style={{ backgroundColor: '#fde3cf', color: '#f56a00' }}>{task.assignee?.charAt(0)}</Avatar>
                    </Tooltip>
                    <Button shape="circle" icon={<PlusOutlined />} size="small" />
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Labels</h4>
                  <div className="flex gap-2">
                    <Tag color="blue" className="px-3 py-1 text-sm rounded cursor-pointer hover:opacity-80 m-0">
                      {task.tag}
                    </Tag>
                    <Button shape="circle" icon={<PlusOutlined />} size="small" />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <AlignLeftOutlined className="text-lg text-slate-600" />
                  <h3 className="text-base font-semibold text-slate-700">Description</h3>
                  <Tooltip title={'Edit'}>
                    <FaEdit size={15} className="cursor-pointer" />
                  </Tooltip>
                </div>
                <div className="ml-8">
                  {task.description ? (
                    <p className="text-slate-700 text-sm whitespace-pre-line">{task.description}</p>
                  ) : (
                    <div className="bg-slate-200/50 p-3 rounded h-16 text-slate-500 text-sm cursor-pointer hover:bg-slate-200">
                      Add a more detailed description...
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <AlignLeftOutlined className="text-lg text-slate-600" />
                  <h3 className="text-base font-semibold text-slate-700">Note</h3>
                  <Tooltip title={'Edit'}>
                    <FaEdit size={15} className="cursor-pointer" />
                  </Tooltip>
                </div>
                <div className="ml-8">
                  {task.note ? (
                    <p className="text-slate-700 text-sm whitespace-pre-line">{task.note}</p>
                  ) : (
                    <div className="text-slate-400 text-sm italic">No notes added.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full space-y-6 flex-shrink-0 border-l border-slate-200 pl-2">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlignLeftOutlined className="text-lg text-slate-600" />
                <h3 className="text-base font-semibold text-slate-700">Activity</h3>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <Avatar>{'U'}</Avatar>
              <div className="flex-1 bg-white border border-slate-200 rounded-md shadow-sm p-2 hover:shadow-md transition-shadow">
                <Input.TextArea placeholder="Write a comment..." autoSize={{ minRows: 1, maxRows: 4 }} variant="borderless" />
              </div>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
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
