const PROCESS_STEPS = [
    { key: 'batch', label: 'Tạo batch' },
    { key: 'extension', label: 'Gửi extension' },
    { key: 'upload', label: 'Upload file' },
    { key: 'amazon', label: 'Amazon xử lý' },
    { key: 'result', label: 'Kết quả' }
];

const STATUS_COPY = {
    queued: { badge: 'Đã gửi extension', summary: 'Đang chờ extension upload file', tone: 'neutral' },
    submitted: { badge: 'Đã gửi file', summary: 'Đang chờ Amazon nhận batch', tone: 'neutral' },
    processing: { badge: 'Amazon đang xử lý', summary: 'Amazon đang xử lý file', tone: 'neutral' },
    done: { badge: 'Thành công', summary: 'Amazon xác nhận thành công', tone: 'success' },
    needs_review: { badge: 'Cần review', summary: 'Amazon cần review', tone: 'warning' },
    failed: { badge: 'Lỗi', summary: 'Amazon báo lỗi', tone: 'danger' }
};

export const isAmazonFeedInProgress = (feed = {}) =>
    ['queued', 'submitted', 'processing'].includes(String(feed.status || '').toLowerCase());

export const buildAmazonFeedProcess = (feed = {}) => {
    const status = String(feed.status || 'queued').toLowerCase();
    const copy = STATUS_COPY[status] || STATUS_COPY.queued;
    const lastStepState = status === 'done'
        ? 'complete'
        : status === 'needs_review'
            ? 'warning'
            : status === 'failed'
                ? 'error'
                : 'pending';
    const activeStep = status === 'queued' ? 1 : 3;

    return {
        ...copy,
        steps: PROCESS_STEPS.map((step, index) => ({
            ...step,
            state: index === PROCESS_STEPS.length - 1
                ? lastStepState
                : index < activeStep || ['done', 'needs_review', 'failed'].includes(status)
                    ? 'complete'
                    : index === activeStep
                        ? 'active'
                        : 'pending'
        }))
    };
};

export const formatAmazonFeedTime = (value) => value
    ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
    : '—';
