import React, { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  DatePicker,
  Empty,
  Form,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
} from 'antd'
import { EditOutlined, PlusOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { contractApi, employeeApi } from '@/api'
import ConfirmDelete from '@/components/common/ConfirmDelete'
import PageHeader from '@/components/common/PageHeader'
import { useAuth } from '@/contexts/AuthContext'
import { useList, useMutation } from '@/hooks/useApi'
import type { Contract, ContractCreateRequest, Employee } from '@/types'
import { formatCurrency, formatDate, getEmployeeDisplayName } from '@/utils/format'
import { PERMISSIONS } from '@/utils/permissions'

const CONTRACT_TYPES = ['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'FREELANCE', 'PROBATION']

const ContractPage: React.FC = () => {
  const { hasPermission } = useAuth()
  const { data, loading, error, fetch } = useList(() => contractApi.listAll())
  const employeeList = useList(() => employeeApi.listAll())
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Contract | null>(null)
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

  const createMut = useMutation((req: ContractCreateRequest) => contractApi.create(req), {
    successMessage: 'Create contract successfully',
    onSuccess: () => {
      setModalOpen(false)
      fetch()
    },
  })

  const updateMut = useMutation(
    (args: { id: number; req: ContractCreateRequest }) => contractApi.update(args.id, args.req),
    {
      successMessage: 'Update contract successfully',
      onSuccess: () => {
        setModalOpen(false)
        fetch()
      },
    }
  )

  const deleteMut = useMutation((id: number) => contractApi.delete(id), {
    successMessage: 'Delete contract successfully',
    onSuccess: () => fetch(),
  })

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (record: Contract) => {
    setEditing(record)
    form.setFieldsValue({
      ...record,
      startDate: record.startDate ? dayjs(record.startDate) : undefined,
      endDate: record.endDate ? dayjs(record.endDate) : undefined,
    })
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    const req: ContractCreateRequest = {
      ...values,
      startDate: values.startDate?.format('YYYY-MM-DD'),
      endDate: values.endDate?.format('YYYY-MM-DD'),
    }

    if (editing) {
      await updateMut.execute({ id: editing.id, req })
      return
    }

    await createMut.execute(req)
  }

  const canCreate = hasPermission(PERMISSIONS.CONTRACT_CREATE)
  const canUpdate = hasPermission(PERMISSIONS.CONTRACT_UPDATE)
  const canDelete = hasPermission(PERMISSIONS.CONTRACT_DELETE)

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    {
      title: 'Employee',
      dataIndex: 'employeeName',
      ellipsis: true,
      render: (_: unknown, record: Contract) => getEmployeeDisplayName(record as unknown as Record<string, unknown>, empMap),
    },
    { title: 'Type', dataIndex: 'contractType', width: 130, render: (value: string) => <Tag>{value}</Tag> },
    { title: 'Base salary', dataIndex: 'baseSalary', width: 150, render: (value?: number | null) => formatCurrency(value) },
    { title: 'Coefficient', dataIndex: 'salaryCoefficient', width: 90 },
    { title: 'Start date', dataIndex: 'startDate', width: 110, render: (value?: string | null) => formatDate(value) },
    {
      title: 'End date',
      dataIndex: 'endDate',
      width: 110,
      render: (value?: string | null) => (value ? formatDate(value) : 'No end date'),
    },
    {
      title: 'Actions',
      width: 160,
      fixed: 'right' as const,
      render: (_: unknown, record: Contract) => (
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
        title="Contracts"
        subtitle={`${data.length} contracts`}
        extra={
          canCreate
            ? [
                <Button key="create" type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                  Add contract
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
        locale={{ emptyText: <Empty description="No contracts" /> }}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: total => `Total ${total} records` }}
        scroll={{ x: 1000 }}
      />
      <Modal
        open={modalOpen}
        title={editing ? 'Edit contract' : 'Add contract'}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={createMut.loading || updateMut.loading}
        okText={editing ? 'Update' : 'Create'}
        cancelText="Cancel"
        width={580}
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
            name="contractType"
            label="Contract type"
            rules={[{ required: true, message: 'Please select contract type' }]}
          >
            <Select
              placeholder="Select contract type"
              options={CONTRACT_TYPES.map(type => ({ value: type, label: type }))}
            />
          </Form.Item>
          <Form.Item
            name="baseSalary"
            label="Base salary"
            rules={[{ required: true, message: 'Please enter base salary' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={500000}
              formatter={value => `${value ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Form.Item>
          <Form.Item
            name="salaryCoefficient"
            label="Salary coefficient"
            rules={[{ required: true, message: 'Please enter salary coefficient' }]}
            initialValue={1}
          >
            <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
          </Form.Item>
          <Form.Item
            name="startDate"
            label="Start date"
            rules={[{ required: true, message: 'Please select start date' }]}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="endDate" label="End date">
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default ContractPage
