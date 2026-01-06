import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Tag, Tooltip, Avatar, Checkbox, Dropdown } from 'antd';
import { CalendarOutlined, PaperClipOutlined, DeleteOutlined, ExpandAltOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const TaskCard = React.memo(({ task, index, columnId, onTaskClick, onToggleComplete, onDeleteTask, canEditBoard, allMembers = [] }) => {
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
              className={`bg-white p-3 rounded-lg shadow-sm border border-slate-200 group hover:border-blue-400 cursor-grab hover:shadow-md transition-colors duration-100 ${
                snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-200' : ''
              }`}
            >
              {task.attachments && task.attachments.length > 0 && (
                <div className="h-32 w-full mb-2 rounded-md overflow-hidden bg-slate-100">
                  <img src={task.attachments[0]} alt="cover" className="w-full h-full object-cover" />
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
                </div>
              </div>

              <div className="flex items-start gap-2 mb-2.5">
                <Checkbox checked={task.isCompleted} onChange={(e) => onToggleComplete(task.id, columnId, e.target.checked)} />
                <h4 className={`text-sm font-medium text-slate-700 leading-snug ${task.isCompleted ? 'line-through text-slate-400' : ''}`}>
                  {task.title}
                </h4>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-50 mt-1">
                <div className="flex items-center text-xs text-slate-400 gap-2">
                  {task.due && (
                    <div className="flex items-center gap-1 hover:text-slate-600">
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
                  <Avatar.Group maxCount={2} size="small" maxStyle={{ color: '#f56a00', backgroundColor: '#fde3cf', fontSize: '10px' }}>
                    {/* Hiển thị Avatar dựa trên User ID */}
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
                </div>
              </div>
            </div>
          </Dropdown>
        </div>
      )}
    </Draggable>
  );
});

export default TaskCard;
