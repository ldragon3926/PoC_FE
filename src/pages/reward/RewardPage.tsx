import React, { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
} from 'antd'
import { EditOutlined, PlusOutlined } from '@ant-design/icons'
import { employeeApi, rewardApi } from '@/api'
import ConfirmDelete from '@/components/common/ConfirmDelete'
import PageHeader from '@/components/common/PageHeader'
import { useAuth } from '@/contexts/AuthContext'
import { useList, useMutation } from '@/hooks/useApi'
import type { Employee, Reward, RewardCreateRequest } from '@/types'
import { formatCurrency, formatDate, getEmployeeDisplayName } from '@/utils/format'
import { PERMISSIONS } from '@/utils/permissions'

const RewardPage: React.FC = () => {
  const { hasPermission } = useAuth()
  const { data, loading, error, fetch } = useList(() => rewardApi.listAll())
  const employeeList = useList(() => employeeApi.listAll())
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Reward | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetch()
    employeeList.fetch()
  }, [])

  const empMap = React.useMemo(() => {
    const map: Record<number, string> = {}
    employeeList.data.forEach((employee: Employee) => {
      map[employee.id] = employee.name
    })
    return map
  }, [employeeList.data])

  const createMut = useMutation((req: RewardCreateRequest) => rewardApi.create(req), {
    successMessage: 'Create reward successfully',
    onSuccess: () => {
      setModalOpen(false)
      fetch()
    },
  })

  const updateMut = useMutation(
    (args: { id: number; req: RewardCreateRequest }) => rewardApi.update(args.id, args.req),
    {
      successMessage: 'Update reward successfully',
      onSuccess: () => {
        setModalOpen(false)
        fetch()
      },
    }
  )

  const deleteMut = useMutation((id: number) => rewardApi.delete(id), {
    successMessage: 'Delete reward successfully',
    onSuccess: () => fetch(),
  })

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (record: Reward) => {
    setEditing(record)
    form.setFieldsValue(record)
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    if (editing) {
      await updateMut.execute({ id: editing.id, req: values })
      return
    }
    await createMut.execute(values)
  }

  const canCreate = hasPermission(PERMISSIONS.REWARD_CREATE)
  const canUpdate = hasPermission(PERMISSIONS.REWARD_UPDATE)
  const canDelete = hasPermission(PERMISSIONS.REWARD_DELETE)

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    {
      title: 'Employee',
      dataIndex: 'employeeName',
      ellipsis: true,
      render: (_: unknown, record: Reward) => getEmployeeDisplayName(record as unknown as Record<string, unknown>, empMap),
    },
    { title: 'Amount', dataIndex: 'amount', width: 160, render: (value?: number | null) => formatCurrency(value) },
    { title: 'Reason', dataIndex: 'reason', ellipsis: true, render: (value?: string) => value || '-' },
    { title: 'Created at', dataIndex: 'createdAt', width: 120, render: (value?: string | null) => formatDate(value) },
    {
      title: 'Actions',
      width: 160,
      fixed: 'right' as const,
      render: (_: unknown, record: Reward) => (
        <Space>
          {canUpdate && (
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
              Edit
            </Button>
          )}
          {canDelete && <ConfirmDelete onConfirm={() => deleteMut.execute(record.id)} />}
        </Space>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Rewards"
        subtitle={`${data.length} records`}
        extra={
          canCreate
            ? [
                <Button key="create" type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                  Add reward
                </Button>,
              ]
            : undefined
        }
      />
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        locale={{ emptyText: <Empty description="No rewards" /> }}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: total => `Total ${total} records` }}
        scroll={{ x: 800 }}
      />
      <Modal
        open={modalOpen}
        title={editing ? 'Edit reward' : 'Add reward'}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={createMut.loading || updateMut.loading}
        okText={editing ? 'Update' : 'Create'}
        cancelText="Cancel"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="employeeId"
            label="Employee"
            rules={[{ required: true, message: 'Please select an employee' }]}
          >
            <Select
              placeholder="Select employee"
              showSearch
              loading={employeeList.loading}
              optionFilterProp="label"
              options={employeeList.data.map(employee => ({
                value: employee.id,
                label: employee.name,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="amount"
            label="Reward amount"
            rules={[{ required: true, message: 'Please enter reward amount' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={100000}
              formatter={value => `${value ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Form.Item>
          <Form.Item name="reason" label="Reason">
            <Input.TextArea rows={3} placeholder="Reason" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default RewardPage
