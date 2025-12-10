import { useState, useEffect } from 'react';
import { Modal, Button, Space } from 'antd';
import { CheckCircleFilled, LoadingOutlined, RocketOutlined, CloseOutlined } from '@ant-design/icons';

const ConfirmShipModal = ({
  open,
  onClose,
  onConfirm,
  title = 'Create file confirm shipping',
  description = 'Create a file containing the orders that need shipping confirmation from Amazon.',
  loadingText = 'Processing...',
  loadingDescription = 'Please wait a moment',
  successText = 'Success!',
  successDescription = 'The shipping confirmation file has been successfully created',
}) => {
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStatus('idle');
      }, 300);
    }
  }, [open]);

  const handleConfirm = async () => {
    setStatus('loading');

    try {
      if (onConfirm) {
        await onConfirm();
      }
      setStatus('success');
    } catch (error) {
      console.error('Confirm error:', error);
      setStatus('idle');
      onClose?.();
    }
  };

  const handleClose = () => {
    onClose?.();
  };

  return (
    <Modal
      open={open}
      footer={null}
      closable={status === 'idle' || status === 'success'}
      width={400}
      maskClosable={status === 'idle' || status === 'success'}
      onCancel={handleClose}
      styles={{
        body: { padding: '50px 30px' },
      }}
    >
      <div style={{ textAlign: 'center' }}>
        {status === 'idle' && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <RocketOutlined
              style={{
                fontSize: '64px',
                color: '#1890ff',
              }}
            />
            <div>
              <h3 style={{ marginBottom: '8px', fontSize: '18px' }}>{title}</h3>
              <p style={{ color: '#8c8c8c', margin: 0 }}>{description}</p>
            </div>
            <Space size="middle" style={{}}>
              <div class="space-y-2">
                <button
                  onClick={handleConfirm}
                  style={{ color: 'white' }}
                  class="relative cursor-pointer bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-full shadow-md hover:shadow-blue-500/50 transition-all duration-300 flex items-center gap-2 group"
                >
                  <svg class="w-5 h-5 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Start create file
                </button>
              </div>
            </Space>
          </Space>
        )}

        {status === 'loading' && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <LoadingOutlined
              style={{
                fontSize: '64px',
                color: '#1890ff',
                animation: 'spin 1s linear infinite',
              }}
            />
            <div>
              <h3 style={{ marginBottom: '8px', fontSize: '18px' }}>{loadingText}</h3>
              <p style={{ color: '#8c8c8c', margin: 0 }}>{loadingDescription}</p>
            </div>
          </Space>
        )}

        {status === 'success' && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div
              style={{
                animation: 'scaleIn 0.5s ease-out',
              }}
            >
              <CheckCircleFilled
                style={{
                  fontSize: '64px',
                  color: '#52c41a',
                }}
              />
            </div>
            <div>
              <h3
                style={{
                  marginBottom: '8px',
                  fontSize: '18px',
                  color: '#52c41a',
                }}
              >
                {successText}
              </h3>
              <p style={{ color: '#8c8c8c', margin: 0 }}>{successDescription}</p>
            </div>
          </Space>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes scaleIn {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </Modal>
  );
};

export { ConfirmShipModal };
