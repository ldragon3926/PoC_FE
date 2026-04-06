import React, { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card, Col, Row, Space, Table, Tag, Typography } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import PageHeader from '@/components/common/PageHeader'
import { integrationApi } from '@/api'
import type { IntegrationConnectorStatus, IntegrationOverview } from '@/types'

const { Text } = Typography

const stateColor = (state?: string) => {
  if (state === 'RUNNING' || state === 'true') return 'success'
  if (state === 'FAILED' || state === 'UNREACHABLE' || state === 'false') return 'error'
  return 'warning'
}

const ReachableTag: React.FC<{ value: boolean }> = ({ value }) => (
  <Tag color={value ? 'success' : 'error'}>{value ? 'REACHABLE' : 'UNREACHABLE'}</Tag>
)

const IntegrationMonitorPage: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [overview, setOverview] = useState<IntegrationOverview | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchOverview = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await integrationApi.getOverview()
      setOverview(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cannot load integration status')
    } finally {
      setLoading(false)
    }
  }

  const connectorRows = useMemo(() => {
    if (!overview) return []
    return overview.connectors.map((connector) => {
      const firstTask = connector.tasks?.[0]
      return {
        key: connector.name,
        name: connector.name,
        type: connector.type || '-',
        connectorState: connector.state || 'UNKNOWN',
        taskState: firstTask?.state || '-',
        workerId: connector.workerId || firstTask?.workerId || '-',
        trace: firstTask?.trace || connector.error || '',
      }
    })
  }, [overview])

  useEffect(() => {
    fetchOverview().catch(() => undefined)
  }, [])

  return (
    <>
      <PageHeader
        title="Integration Monitor"
        subtitle="Theo doi Kafka Connect, Schema Registry va trang thai Source/Sink connector"
      />

      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<ReloadOutlined />} loading={loading} onClick={fetchOverview}>
          Refresh status
        </Button>
      </Space>

      {!overview && !loading && !error && (
        <Alert type="info" showIcon message="Nhan Refresh status de tai thong tin connector." style={{ marginBottom: 16 }} />
      )}

      {error && (
        <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />
      )}

      {overview && (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} md={12}>
              <Card title="Kafka Connect">
                <Space direction="vertical" size={8}>
                  <Text><strong>URL:</strong> {overview.kafkaConnectUrl}</Text>
                  <ReachableTag value={overview.kafkaConnectReachable} />
                </Space>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="Schema Registry">
                <Space direction="vertical" size={8}>
                  <Text><strong>URL:</strong> {overview.schemaRegistryUrl}</Text>
                  <ReachableTag value={overview.schemaRegistryReachable} />
                </Space>
              </Card>
            </Col>
          </Row>

          <Card title="Connector Details">
            <Table
              rowKey="key"
              dataSource={connectorRows}
              pagination={false}
              locale={{ emptyText: 'No connector status' }}
              expandable={{
                expandedRowRender: (record) =>
                  record.trace ? (
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 12 }}>{record.trace}</pre>
                  ) : (
                    <Text type="secondary">No error trace.</Text>
                  ),
                rowExpandable: (record) => !!record.trace,
              }}
              columns={[
                { title: 'Connector', dataIndex: 'name', width: 180 },
                { title: 'Type', dataIndex: 'type', width: 120 },
                {
                  title: 'Connector State',
                  dataIndex: 'connectorState',
                  width: 170,
                  render: (value: string) => <Tag color={stateColor(value)}>{value}</Tag>,
                },
                {
                  title: 'Task State',
                  dataIndex: 'taskState',
                  width: 140,
                  render: (value: string) => <Tag color={stateColor(value)}>{value}</Tag>,
                },
                { title: 'Worker', dataIndex: 'workerId' },
              ]}
            />
          </Card>
        </>
      )}
    </>
  )
}

export default IntegrationMonitorPage
