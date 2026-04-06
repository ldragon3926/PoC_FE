import React, { useEffect, useRef, useState } from 'react'
import { Alert, App, Button, Card, Col, Form, InputNumber, Row, Space, Switch, Table, Tag, Typography } from 'antd'
import { PauseCircleOutlined, PlayCircleOutlined, SendOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import PageHeader from '@/components/common/PageHeader'
import { salaryApi } from '@/api'
import { useAuth } from '@/contexts/AuthContext'
import type { SalaryGenerateAsyncRequest, SalaryJob, SalaryJobStatus } from '@/types'
import { PERMISSIONS } from '@/utils/permissions'

const { Text } = Typography

const statusColor = (status?: SalaryJobStatus) => {
  if (status === 'COMPLETED') return 'success'
  if (status === 'FAILED') return 'error'
  if (status === 'PROCESSING') return 'processing'
  return 'default'
}

const toMillis = (value?: string | null) => (value ? dayjs(value).valueOf() : null)

const formatDuration = (ms: number | null) => {
  if (ms === null || Number.isNaN(ms) || ms < 0) return '-'
  if (ms < 1000) return `${ms} ms`
  return `${(ms / 1000).toFixed(2)} s`
}

const SalaryKafkaPanelPage: React.FC = () => {
  const { message } = App.useApp()
  const { hasPermission } = useAuth()
  const [form] = Form.useForm<SalaryGenerateAsyncRequest>()
  const [job, setJob] = useState<SalaryJob | null>(null)
  const [loading, setLoading] = useState(false)
  const [polling, setPolling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollTimerRef = useRef<number | null>(null)

  const canCreate = hasPermission(PERMISSIONS.SALARY_CREATE)

  const clearPoller = () => {
    if (pollTimerRef.current !== null) {
      window.clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }

  const fetchJob = async (jobId: number) => {
    const response = await salaryApi.getJob(jobId)
    const nextJob = response.data
    setJob(nextJob)

    if (nextJob.status === 'COMPLETED') {
      message.success('Salary job completed successfully')
      clearPoller()
      setPolling(false)
      return
    }

    if (nextJob.status === 'FAILED') {
      message.error(nextJob.errorMessage || 'Salary job failed')
      clearPoller()
      setPolling(false)
    }
  }

  const startPolling = (jobId: number) => {
    clearPoller()
    setPolling(true)
    pollTimerRef.current = window.setInterval(() => {
      fetchJob(jobId).catch((err: Error) => {
        setError(err.message)
        clearPoller()
        setPolling(false)
      })
    }, 2500)
  }

  const submitJob = async () => {
    setError(null)
    const values = await form.validateFields()
    setLoading(true)
    try {
      const response = await salaryApi.generateMonthAsync(values)
      const submittedJob = response.data
      setJob(submittedJob)
      startPolling(submittedJob.id)
      message.success('Submit salary Kafka job successfully')
    } catch (err) {
      const messageText = err instanceof Error ? err.message : 'Submit salary Kafka job failed'
      setError(messageText)
      message.error(messageText)
    } finally {
      setLoading(false)
    }
  }

  const stopPolling = () => {
    clearPoller()
    setPolling(false)
  }

  const manualRefresh = async () => {
    if (!job) return
    setError(null)
    try {
      await fetchJob(job.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cannot refresh job status')
    }
  }

  useEffect(() => {
    form.setFieldsValue({
      month: dayjs().month() + 1,
      year: dayjs().year(),
      overwriteDraft: true,
    })
    return () => clearPoller()
  }, [form])

  const createdMs = toMillis(job?.createdAt)
  const startedMs = toMillis(job?.startedAt)
  const completedMs = toMillis(job?.completedAt)

  const queueDelayMs =
    createdMs !== null && startedMs !== null ? Math.max(0, startedMs - createdMs) : null
  const processingMs =
    startedMs !== null && completedMs !== null ? Math.max(0, completedMs - startedMs) : null
  const endToEndMs =
    createdMs !== null && completedMs !== null ? Math.max(0, completedMs - createdMs) : null

  const metricRows = [
    {
      key: 'queue-delay',
      metric: 'Queue delay',
      value: formatDuration(queueDelayMs),
      note: 'Time from submit to worker start',
    },
    {
      key: 'processing-time',
      metric: 'Processing time',
      value: formatDuration(processingMs),
      note: 'Time worker spent generating salary',
    },
    {
      key: 'end-to-end',
      metric: 'End-to-end',
      value: formatDuration(endToEndMs),
      note: 'Total time from submit to completed',
    },
    {
      key: 'affected-rows',
      metric: 'Affected rows',
      value: job?.affectedRows ?? '-',
      note: 'How many salary records were changed',
    },
    {
      key: 'attempt-count',
      metric: 'Attempt count',
      value: job?.attemptCount ?? '-',
      note: 'Retry count for the current job',
    },
  ]

  return (
    <>
      <PageHeader
        title="Salary Kafka Panel"
        subtitle="Submit salary generation job and track async status via Kafka"
      />

      {!canCreate && (
        <Alert
          type="warning"
          showIcon
          message="You do not have permission to submit salary generation jobs."
          style={{ marginBottom: 16 }}
        />
      )}
      {error && (
        <Alert
          type="error"
          showIcon
          message={error}
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={11}>
          <Card title="Submit Kafka Job">
            <Form layout="vertical" form={form}>
              <Form.Item
                name="month"
                label="Month"
                rules={[
                  { required: true, message: 'Please input month' },
                  { type: 'number', min: 1, max: 12, message: 'Month must be between 1 and 12' },
                ]}
              >
                <InputNumber min={1} max={12} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item
                name="year"
                label="Year"
                rules={[
                  { required: true, message: 'Please input year' },
                  { type: 'number', min: 2000, max: 3000, message: 'Year must be between 2000 and 3000' },
                ]}
              >
                <InputNumber min={2000} max={3000} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="overwriteDraft" label="Overwrite Draft" valuePropName="checked">
                <Switch checkedChildren="ON" unCheckedChildren="OFF" />
              </Form.Item>
              <Space>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  loading={loading}
                  onClick={submitJob}
                  disabled={!canCreate}
                >
                  Submit
                </Button>
                <Button onClick={() => form.resetFields()} disabled={loading}>
                  Reset
                </Button>
              </Space>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={13}>
          <Card
            title="Job Status"
            extra={
              <Space>
                <Button
                  icon={<PlayCircleOutlined />}
                  onClick={() => job && startPolling(job.id)}
                  disabled={!job || polling}
                >
                  Start polling
                </Button>
                <Button
                  icon={<PauseCircleOutlined />}
                  onClick={stopPolling}
                  disabled={!polling}
                >
                  Stop polling
                </Button>
                <Button onClick={manualRefresh} disabled={!job}>
                  Refresh now
                </Button>
              </Space>
            }
          >
            {!job && <Text type="secondary">No job submitted yet.</Text>}
            {job && (
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Text><strong>Job ID:</strong> {job.id}</Text>
                <Text><strong>Job Key:</strong> {job.jobKey}</Text>
                <Text><strong>Period:</strong> {job.month}/{job.year}</Text>
                <Text><strong>Status:</strong> <Tag color={statusColor(job.status)}>{job.status}</Tag></Text>
                <Text><strong>Attempt Count:</strong> {job.attemptCount}</Text>
                <Text><strong>Affected Rows:</strong> {job.affectedRows ?? '-'}</Text>
                <Text><strong>Started At:</strong> {job.startedAt || '-'}</Text>
                <Text><strong>Completed At:</strong> {job.completedAt || '-'}</Text>
                <Text><strong>Polling:</strong> {polling ? 'Running' : 'Stopped'}</Text>
                {job.errorMessage && (
                  <Alert type="error" showIcon message={job.errorMessage} />
                )}
              </Space>
            )}
          </Card>

          <Card title="Kafka Job Metrics" style={{ marginTop: 16 }}>
            <Table
              size="small"
              rowKey="key"
              pagination={false}
              dataSource={job ? metricRows : []}
              locale={{ emptyText: 'Submit a job to view Kafka metrics.' }}
              columns={[
                { title: 'Metric', dataIndex: 'metric', width: 180 },
                { title: 'Value', dataIndex: 'value', width: 140 },
                { title: 'Meaning', dataIndex: 'note' },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default SalaryKafkaPanelPage
