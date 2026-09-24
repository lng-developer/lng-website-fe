import assert from 'node:assert/strict';
import test from 'node:test';
import { buildAmazonFeedProcess } from './amazonFeedProcess.js';

test('marks every stage complete once Amazon confirms the feed', () => {
    const process = buildAmazonFeedProcess({
        status: 'done',
        amazonBatchId: '93703020720',
        recordsProcessed: 2,
        recordsActivated: 2,
        errorCount: 0
    });

    assert.equal(process.tone, 'success');
    assert.equal(process.steps.every((step) => step.state === 'complete'), true);
    assert.equal(process.summary, 'Amazon xác nhận thành công');
});

test('keeps Amazon processing active until its processing report is terminal', () => {
    const process = buildAmazonFeedProcess({ status: 'processing' });

    assert.equal(process.tone, 'neutral');
    assert.equal(process.steps.at(-2).state, 'active');
    assert.equal(process.steps.at(-1).state, 'pending');
});

test('shows a review outcome without calling it a successful confirmation', () => {
    const process = buildAmazonFeedProcess({ status: 'needs_review', errorCount: 1 });

    assert.equal(process.tone, 'warning');
    assert.equal(process.steps.at(-1).state, 'warning');
    assert.equal(process.summary, 'Amazon cần review');
});
