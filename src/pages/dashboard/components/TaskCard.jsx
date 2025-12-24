import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Tag, Tooltip, Avatar, Checkbox } from 'antd';
import { CalendarOutlined, PaperClipOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const TaskCard = React.memo(({ task, index, columnId, onTaskClick, onToggleComplete }) => {
  const priorityColor = task.priority === 'High' ? 'red' : task.priority === 'Medium' ? 'orange' : 'green';

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={(e) => {
            // Ngăn click modal khi bấm vào checkbox
            if (!e.target.closest('.ant-checkbox-wrapper')) {
              onTaskClick(task, columnId);
            }
          }}
          style={{ ...provided.draggableProps.style, opacity: snapshot.isDragging ? 0.8 : 1 }}
          className={`
    bg-white p-3 rounded-lg shadow-sm border border-slate-200 mb-2.5 group 
    hover:border-blue-400 cursor-pointer hover:shadow-md 
    transition-colors duration-0
    ${snapshot.isDragging ? 'shadow-lg ring-1 ring-blue-200 rotate-2' : ''}
`}
        >
          {task.attachments && task.attachments.length > 0 && (
            <div className="h-32 w-full mb-2 rounded-md overflow-hidden bg-slate-100">
              <img src={task.attachments[0]} alt="cover" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="flex justify-between items-start mb-2">
            <div className="w-full flex gap-1 flex-wrap">
              <Tag color="blue" className="!mr-1 text-[10px] !px-1">
                {task.tag}
              </Tag>
              <Tag color={priorityColor} className="!mr-0 text-[10px] !px-1">
                {task.priority}
              </Tag>
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
            <Tooltip title={task.assignee}>
              <Avatar size={22} style={{ backgroundColor: '#fde3cf', color: '#f56a00', fontSize: '12px' }}>
                {task.assignee?.charAt(0)}
              </Avatar>
            </Tooltip>
          </div>
        </div>
      )}
    </Draggable>
  );
});

export default TaskCard;
