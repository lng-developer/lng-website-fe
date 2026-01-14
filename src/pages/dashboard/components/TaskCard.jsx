import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Tag, Tooltip, Avatar, Checkbox, Dropdown } from 'antd';
import { CalendarOutlined, PaperClipOutlined, DeleteOutlined, ExpandAltOutlined, WarningOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const TaskCard = React.memo(
  ({ task, index, columnId, onTaskClick, onToggleComplete, onDeleteTask, canEditBoard, allMembers = [], currentUserId }) => {
    const priorityColor = task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'orange' : 'green';

    const menuItems = [
      { key: 'open', label: 'Open card', icon: <ExpandAltOutlined />, onClick: () => onTaskClick(task, columnId) },
      { key: 'edit', label: 'Edit details', onClick: () => onTaskClick(task, columnId) },
    ];

    if (canEditBoard) {
      menuItems.push({ type: 'divider' });
      menuItems.push({
        key: 'delete',
        label: 'Delete',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => onDeleteTask(task.id, columnId),
      });
    }

    // Logic tìm ảnh cover
    const coverImage = task.attachments?.find((att) => {
      if (att.type === 'file' && att.mime?.startsWith('image/')) return true;
      if (typeof att.url === 'string') {
        return /\.(jpeg|jpg|gif|png|webp|bmp|svg)$/i.test(att.url);
      }
      return false;
    });

    const isOverdue = task.due && dayjs().isAfter(dayjs(task.due).endOf('day')) && !task.isCompleted;
    // Logic kiểm tra assign to me
    const isAssignedToMe = React.useMemo(() => {
      if (!currentUserId || !task.assignees) return false;
      return task.assignees.some((u) => {
        const id = typeof u === 'object' ? u._id : u;
        return String(id) === String(currentUserId);
      });
    }, [task.assignees, currentUserId]);

    return (
      <Draggable draggableId={task.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={{ ...provided.draggableProps.style, opacity: snapshot.isDragging ? 0.8 : 1 }}
          >
            <Dropdown menu={{ items: menuItems }} trigger={['contextMenu']} placement="right">
              <div
                onClick={(e) => {
                  if (!e.target.closest('.ant-checkbox-wrapper')) onTaskClick(task, columnId);
                }}
                className={`bg-white p-2 rounded-lg shadow-sm border group cursor-grab hover:shadow-md transition-all duration-200 ${
                  snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-200' : ''
                } ${isAssignedToMe ? 'border-blue-400 ring-1 ring-blue-100 shadow-blue-100' : 'border-slate-200 hover:border-blue-300'}`}
              >
                {coverImage && (
                  <div className="h-32 w-full mb-2 rounded-md overflow-hidden bg-slate-100 border border-slate-100">
                    <img
                      src={coverImage.url}
                      alt="cover"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}

                <div className="flex justify-between items-start mb-2">
                  <div className="w-full flex gap-1 flex-wrap">
                    {task.tag && (
                      <Tag color="blue" className="!mr-1 text-[10px] !px-1">
                        {task.tag}
                      </Tag>
                    )}
                    {task.priority && (
                      <Tag color={priorityColor} className="!mr-0 !text-[10px] !px-1 ">
                        {task.priority}
                      </Tag>
                    )}
                    {/* [NEW] Hiển thị cảnh báo Overdue */}
                    {isOverdue && (
                      <Tag color="error" className="!mr-0 text-[10px] !px-1 flex items-center gap-1">
                        Overdue
                      </Tag>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox checked={task.isCompleted} onChange={(e) => onToggleComplete(task.id, columnId, e.target.checked)} />
                  <h4
                    className={`text-sm font-medium text-slate-700 leading-snug ${task.isCompleted ? 'line-through text-slate-400' : ''}`}
                  >
                    {task.title}
                  </h4>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-50 ">
                  <div className="flex items-center text-xs text-slate-400 gap-2">
                    {task.due && (
                      <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-500 font-bold' : 'hover:text-slate-600'}`}>
                        <CalendarOutlined /> <span>{dayjs(task.due).format('MMM D')}</span>
                      </div>
                    )}
                    {task.attachments && task.attachments.length > 0 && (
                      <div className="flex items-center gap-1 hover:text-slate-600" title="Attachments">
                        <PaperClipOutlined /> <span>{task.attachments.length}</span>
                      </div>
                    )}
                  </div>

                  <div onClick={(e) => e.stopPropagation()}>
                    <Avatar.Group maxCount={3} size="small" maxStyle={{ color: '#f56a00', backgroundColor: '#fde3cf', fontSize: '10px' }}>
                      {task.assignees?.map((userOrId, idx) => {
                        // [UPDATED] Ưu tiên dùng full_name có sẵn, nếu không mới tìm trong allMembers
                        let member = userOrId;
                        if (typeof userOrId !== 'object') {
                          member = allMembers.find((u) => u._id === userOrId);
                        }

                        const name = member?.full_name || 'Unknown';
                        const isMe = String(member?._id) === String(currentUserId);

                        return (
                          <Tooltip title={name} key={idx}>
                            <Avatar
                              style={{
                                backgroundColor: isMe ? '#1677ff' : '#fde3cf',
                                color: isMe ? '#fff' : '#f56a00',
                                border: isMe ? '2px solid white' : 'none',
                              }}
                            >
                              {name.charAt(0)}
                            </Avatar>
                          </Tooltip>
                        );
                      })}
                    </Avatar.Group>
                  </div>
                </div>
              </div>
            </Dropdown>
          </div>
        )}
      </Draggable>
    );
  }
);

export default TaskCard;
