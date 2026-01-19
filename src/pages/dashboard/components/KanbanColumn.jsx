import React, { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Button, Tooltip, Input, Dropdown, Menu, Image } from 'antd'; // Thêm Image từ antd nếu cần, hoặc dùng thẻ img thường
import {
  DoubleRightOutlined,
  DoubleLeftOutlined,
  MoreOutlined,
  PlusOutlined,
  CloseOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import TaskCard from './TaskCard';

const KanbanColumn = React.memo(
  ({
    columnId,
    title,
    config,
    items,
    collapsedCols,
    toggleColumn,
    canEditBoard,
    onTaskClick,
    onToggleComplete,
    onQuickAdd,
    onDeleteTask,
    allMembers,
    onUpdateCategory,
    onRequestArchiveCategory,
    currentUserId,
  }) => {
    const isCollapsed = collapsedCols[columnId];
    const { collapsedBg } = config || { collapsedBg: 'bg-gray-200' };

    const [isAdding, setIsAdding] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleValue, setTitleValue] = useState(title);

    const [newTitle, setNewTitle] = useState('');
    const [pastedImage, setPastedImage] = useState(null);
    // --- QUICK ADD LOGIC ---
    const handleQuickSubmit = () => {
      // Cho phép tạo nếu có title HOẶC có ảnh
      if (!newTitle.trim() && !pastedImage) {
        if (!pastedImage) {
          setIsAdding(false);
          return;
        }
      }
      onQuickAdd(columnId, newTitle, pastedImage);
      setNewTitle('');
      setPastedImage(null);
      setIsAdding(false);
    };

    const handlePaste = (e) => {
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          // [FIX] Lưu trực tiếp File object, không đọc thành Base64
          setPastedImage(file);
          e.preventDefault();
          return; // Chỉ lấy 1 ảnh
        }
      }
    };

    // --- COLUMN ACTIONS ---
    const handleSaveTitle = () => {
      if (titleValue !== title) {
        onUpdateCategory(columnId, titleValue);
      }
      setIsEditingTitle(false);
    };

    const columnMenu = (
      <Menu>
        <Menu.Item key="edit" icon={<EditOutlined />} onClick={() => setIsEditingTitle(true)}>
          Edit Name
        </Menu.Item>
        <Menu.Item key="archive" icon={<DeleteOutlined />} danger onClick={() => onRequestArchiveCategory(columnId)}>
          Archive
        </Menu.Item>
      </Menu>
    );

    if (isCollapsed) {
      return (
        <div
          onClick={() => toggleColumn(columnId)}
          className={`flex-shrink-0 w-12 py-4 rounded-2xl cursor-pointer flex flex-col items-center gap-6 select-none hover:brightness-95 shadow-sm ${collapsedBg}`}
        >
          <Tooltip title="Expand" placement="right">
            <div className="px-3 rounded-xl hover:bg-white/50 transition-colors">
              <DoubleRightOutlined className="text-slate-600 font-bold" style={{ fontSize: '12px' }} />
            </div>
          </Tooltip>
          <div className="flex-1 flex items-center justify-center py-4" style={{ writingMode: 'vertical-rl' }}>
            <h3 className="font-medium text-slate-700 text-sm tracking-widest whitespace-nowrap">{title}</h3>
          </div>
          <div className="bg-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-700 shadow-sm mb-2">
            {items.length}
          </div>
        </div>
      );
    }

    return (
      <div className={`flex-shrink-0 w-64 flex flex-col max-h-full rounded-xl border-gray-200 border-1`}>
        <div className="flex justify-between items-center p-3 pb-2 ">
          {/* EDIT TITLE MODE */}
          {isEditingTitle ? (
            <Input
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleSaveTitle}
              onPressEnter={handleSaveTitle}
              autoFocus
              size="small"
              className="font-semibold text-sm"
            />
          ) : (
            <h3
              className="font-semibold text-slate-700 text-sm px-1 cursor-pointer"
              onClick={() => canEditBoard && setIsEditingTitle(true)}
            >
              {title} <span className="ml-1 text-slate-500 font-normal">{items.length}</span>
            </h3>
          )}

          <div className="flex gap-1">
            <Tooltip title="Collapse">
              <Button
                type="text"
                size="small"
                icon={<DoubleLeftOutlined />}
                onClick={() => toggleColumn(columnId)}
                className="text-slate-500 hover:bg-slate-200"
              />
            </Tooltip>
            {canEditBoard && (
              <Dropdown overlay={columnMenu} trigger={['click']}>
                <Button type="text" size="small" icon={<MoreOutlined />} className="text-slate-500 hover:bg-slate-200" />
              </Dropdown>
            )}
          </div>
        </div>

        <Droppable droppableId={columnId}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`flex-1 overflow-y-auto px-2 min-h-[50px] ${
                snapshot.isDraggingOver ? 'bg-black/5 rounded-lg' : ''
              } scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent`}
            >
              {items.map((task, index) => (
                <div key={task.id}>
                  <TaskCard
                    task={task}
                    index={index}
                    columnId={columnId}
                    onTaskClick={onTaskClick}
                    onToggleComplete={onToggleComplete}
                    onDeleteTask={onDeleteTask}
                    canEditBoard={canEditBoard}
                    allMembers={allMembers}
                    currentUserId={currentUserId}
                  />
                  <div className="h-2"></div>
                </div>
              ))}
              {provided.placeholder}

              {isAdding && (
                <div className="bg-white p-2 rounded shadow-sm border border-blue-200 mb-2">
                  {pastedImage && (
                    <div className="mb-2 relative">
                      {/* [FIX] Dùng URL.createObjectURL để hiển thị File object */}
                      <img
                        src={URL.createObjectURL(pastedImage)}
                        alt="pasted"
                        className="w-full h-20 object-cover rounded border border-slate-200"
                      />
                      <Button
                        size="small"
                        shape="circle"
                        icon={<CloseOutlined />}
                        className="absolute top-1 right-1 bg-white/80 hover:bg-red-50 hover:text-red-500"
                        onClick={() => setPastedImage(null)}
                      />
                    </div>
                  )}
                  <Input.TextArea
                    autoFocus
                    placeholder="Enter title..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleQuickSubmit();
                      }
                    }}
                    onPaste={handlePaste}
                    autoSize={{ minRows: 2, maxRows: 4 }}
                    className="mb-2 text-sm"
                  />
                  <div className="flex gap-2 mt-2 items-center">
                    <button
                      className="p-1 px-2 text-white bg-blue-500 rounded-sm cursor-pointer hover:opacity-85"
                      onClick={handleQuickSubmit}
                    >
                      <span className="font-medium text-sm text-white py-4">Add Card</span>
                    </button>
                    <Button size="small" type="text" onClick={() => setIsAdding(false)}>
                      <CloseOutlined />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Droppable>

        {canEditBoard && !isAdding && (
          <div className="p-2 pt-1">
            <div className="border-t-1 rounded-2xl border-slate-200"></div>
            <Button
              type="text"
              block
              icon={<PlusOutlined />}
              className="text-slate-500 hover:bg-slate-200 hover:text-slate-700 text-left justify-start"
              onClick={() => setIsAdding(true)}
            >
              Add a card
            </Button>
          </div>
        )}
      </div>
    );
  }
);

export default KanbanColumn;
