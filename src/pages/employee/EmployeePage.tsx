import React, { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  DatePicker,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
} from 'antd'
import { EditOutlined, PlusOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { departmentApi, employeeApi } from '@/api'
import ConfirmDelete from '@/components/common/ConfirmDelete'
import PageHeader from '@/components/common/PageHeader'
import { useAuth } from '@/contexts/AuthContext'
import { useList, useMutation } from '@/hooks/useApi'
import type { Department, Employee, EmployeeCreateRequest } from '@/types'
import { formatDate } from '@/utils/format'
import { PERMISSIONS } from '@/utils/permissions'

const EmployeePage: React.FC = () => {
  const { hasPermission } = useAuth()
  const { data, loading, error, fetch } = useList(() => employeeApi.listAll())
  const deptList = useList(() => departmentApi.listAll())
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [form] = Form.useForm()
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch()
    deptList.fetch()
  }, [])

  const deptMap = React.useMemo(() => {
    const map: Record<number, string> = {}
    deptList.data.forEach((dept: Department) => {
      map[dept.id] = dept.name
    })
    return map
  }, [deptList.data])

  const createMut = useMutation((req: EmployeeCreateRequest) => employeeApi.create(req), {
    successMessage: 'Create employee successfully',
    onSuccess: () => {
      setModalOpen(false)
      fetch()
    },
  })

  const updateMut = useMutation(
    (args: { id: number; req: EmployeeCreateRequest }) => employeeApi.update(args.id, args.req),
    {
      successMessage: 'Update employee successfully',
      onSuccess: () => {
        setModalOpen(false)
        fetch()
      },
    }
  )

  const deleteMut = useMutation((id: number) => employeeApi.delete(id), {
    successMessage: 'Delete employee successfully',
    onSuccess: () => fetch(),
  })

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (record: Employee) => {
    setEditing(record)
    form.setFieldsValue({
      ...record,
      dob: record.dob ? dayjs(record.dob) : undefined,
    })
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    const req: EmployeeCreateRequest = {
      ...values,
      dob: values.dob ? values.dob.format('YYYY-MM-DD') : undefined,
    }

    if (editing) {
      await updateMut.execute({ id: editing.id, req })
      return
    }

    await createMut.execute(req)
  }

  const filtered = data.filter(employee => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return true
    return (
      employee.name.toLowerCase().includes(keyword) ||
      employee.email.toLowerCase().includes(keyword)
    )
  })

  const canCreate = hasPermission(PERMISSIONS.EMPLOYEE_CREATE)
  const canUpdate = hasPermission(PERMISSIONS.EMPLOYEE_UPDATE)
  const canDelete = hasPermission(PERMISSIONS.EMPLOYEE_DELETE)

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: 'Name', dataIndex: 'name', ellipsis: true },
    { title: 'Email', dataIndex: 'email', ellipsis: true },
    { title: 'Phone', dataIndex: 'phone', width: 130, render: (value?: string) => value || '-' },
    {
      title: 'Department',
      dataIndex: 'departmentId',
      width: 160,
      render: (id?: number) => (id ? <Tag color="blue">{deptMap[id] || id}</Tag> : '-'),
    },
    { title: 'Birth date', dataIndex: 'dob', width: 120, render: (value?: string | null) => formatDate(value) },
    { title: 'Created at', dataIndex: 'createdAt', width: 120, render: (value?: string | null) => formatDate(value) },
    {
      title: 'Actions',
      width: 160,
      fixed: 'right' as const,
      render: (_: unknown, record: Employee) => (
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
        title="Employees"
        subtitle={`${data.length} employees`}
        extra={[
          <Input.Search
            key="search"
            placeholder="Search by name or email"
            value={search}
            onChange={event => setSearch(event.target.value)}
            style={{ width: 260 }}
            allowClear
          />,
          canCreate ? (
            <Button key="create" type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Add employee
            </Button>
          ) : null,
        ].filter(Boolean)}
      />
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={filtered}
        loading={loading}
        locale={{ emptyText: <Empty description="No employees" /> }}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: total => `Total ${total} records` }}
        scroll={{ x: 1000 }}
      />
      <Modal
        open={modalOpen}
        title={editing ? 'Edit employee' : 'Add employee'}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={createMut.loading || updateMut.loading}
        okText={editing ? 'Update' : 'Create'}
        cancelText="Cancel"
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please enter employee name' }]}>
            <Input placeholder="Nguyen Van A" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Invalid email address' },
            ]}
          >
            <Input placeholder="email@company.com" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Phone"
            rules={[{ pattern: /^[0-9]{9,11}$/, message: 'Invalid phone number' }]}
          >
            <Input placeholder="0901234567" />
          </Form.Item>
          <Form.Item name="dob" label="Birth date">
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Select date" />
          </Form.Item>
          <Form.Item name="departmentId" label="Department">
            <Select
              placeholder="Select department"
              allowClear
              loading={deptList.loading}
              options={deptList.data.map(dept => ({ value: dept.id, label: dept.name }))}
            />
          </Form.Item>
          <Form.Item name="address" label="Address">
            <Input.TextArea rows={2} placeholder="Address" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default EmployeePage
