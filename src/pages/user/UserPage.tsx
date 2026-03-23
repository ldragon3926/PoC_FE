import React, { useEffect, useState } from 'react'
import { Alert, Button, Empty, Form, Input, Modal, Select, Space, Table, Tag } from 'antd'
import { EditOutlined, PlusOutlined } from '@ant-design/icons'
import { employeeApi, roleApi, userApi } from '@/api'
import ConfirmDelete from '@/components/common/ConfirmDelete'
import PageHeader from '@/components/common/PageHeader'
import StatusTag from '@/components/common/StatusTag'
import { useAuth } from '@/contexts/AuthContext'
import { useList, useMutation } from '@/hooks/useApi'
import type { Role, User, UserCreateRequest, UserUpdateRequest } from '@/types'
import { getEmployeeDisplayName } from '@/utils/format'
import { PERMISSIONS } from '@/utils/permissions'

const UserPage: React.FC = () => {
  const { hasPermission } = useAuth()
  const { data, loading, error, fetch } = useList(() => userApi.listAll())
  const roleList = useList(() => roleApi.listAll())
  const employeeList = useList(() => employeeApi.listAll())
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form] = Form.useForm()
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch()
    roleList.fetch()
    employeeList.fetch()
  }, [])

  const createMut = useMutation((req: UserCreateRequest) => userApi.create(req), {
    successMessage: 'Create user successfully',
    onSuccess: () => {
      setModalOpen(false)
      fetch()
    },
  })

  const updateMut = useMutation(
    (args: { id: number; req: UserUpdateRequest }) => userApi.update(args.id, args.req),
    {
      successMessage: 'Update user successfully',
      onSuccess: () => {
        setModalOpen(false)
        fetch()
      },
    }
  )

  const deleteMut = useMutation((id: number) => userApi.delete(id), {
    successMessage: 'Delete user successfully',
    onSuccess: () => fetch(),
  })

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (record: User) => {
    setEditing(record)
    form.setFieldsValue({ ...record, password: undefined })
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()

    if (editing) {
      const { password, ...rest } = values
      const req: UserUpdateRequest = password ? values : rest
      await updateMut.execute({ id: editing.id, req })
      return
    }

    await createMut.execute(values)
  }

  const filtered = data.filter(user => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return true
    return (
      user.username.toLowerCase().includes(keyword) ||
      user.email.toLowerCase().includes(keyword)
    )
  })

  const canCreate = hasPermission(PERMISSIONS.USER_CREATE)
  const canUpdate = hasPermission(PERMISSIONS.USER_UPDATE)
  const canDelete = hasPermission(PERMISSIONS.USER_DELETE)

  const getRoleLabels = (record: User) => {
    if (record.roles?.length) {
      return record.roles.map(role => ({ id: role.id, label: role.name || role.code }))
    }

    if (record.roleNames?.length) {
      return record.roleNames.map((name, index) => ({ id: index, label: name }))
    }

    if (record.idRoles?.length) {
      return record.idRoles.map(id => {
        const role = roleList.data.find(item => item.id === id)
        return { id, label: role?.name || `${id}` }
      })
    }

    return []
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: 'Username', dataIndex: 'username', ellipsis: true },
    { title: 'Email', dataIndex: 'email', ellipsis: true },
    {
      title: 'Employee',
      dataIndex: 'employeeName',
      ellipsis: true,
      render: (_: unknown, record: User) => getEmployeeDisplayName(
        record as unknown as Record<string, unknown>,
        Object.fromEntries(employeeList.data.map(item => [item.id, item.name]))
      ),
    },
    {
      title: 'Roles',
      dataIndex: 'roles',
      width: 200,
      render: (_: unknown, record: User) => {
        const roles = getRoleLabels(record)
        return roles.length
          ? roles.map(role => (
              <Tag key={role.id} color="purple">
                {role.label}
              </Tag>
            ))
          : '-'
      },
    },
    { title: 'Status', dataIndex: 'status', width: 120, render: (value: string) => <StatusTag status={value} /> },
    {
      title: 'Actions',
      width: 160,
      fixed: 'right' as const,
      render: (_: unknown, record: User) => (
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
        title="Users"
        subtitle={`${data.length} users`}
        extra={[
          <Input.Search
            key="search"
            placeholder="Search by username or email"
            value={search}
            onChange={event => setSearch(event.target.value)}
            style={{ width: 260 }}
            allowClear
          />,
          canCreate ? (
            <Button key="create" type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Add user
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
        locale={{ emptyText: <Empty description="No users" /> }}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: total => `Total ${total} records` }}
        scroll={{ x: 900 }}
      />
      <Modal
        open={modalOpen}
        title={editing ? 'Edit user' : 'Add user'}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={createMut.loading || updateMut.loading}
        okText={editing ? 'Update' : 'Create'}
        cancelText="Cancel"
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="username" label="Username" rules={[{ required: true, message: 'Please enter username' }]}>
            <Input placeholder="admin" />
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
            name="password"
            label={editing ? 'New password (optional)' : 'Password'}
            rules={
              editing
                ? []
                : [
                    { required: true, message: 'Please enter password' },
                    { min: 6, message: 'Password must be at least 6 characters' },
                  ]
            }
          >
            <Input.Password placeholder={editing ? 'Keep current password if left blank' : '********'} />
          </Form.Item>
          <Form.Item name="employeeId" label="Employee link">
            <Select
              placeholder="Select employee"
              allowClear
              loading={employeeList.loading}
              showSearch
              optionFilterProp="label"
              options={employeeList.data.map(employee => ({
                value: employee.id,
                label: employee.name,
              }))}
            />
          </Form.Item>
          <Form.Item name="idRoles" label="Roles">
            <Select
              mode="multiple"
              placeholder="Select roles"
              allowClear
              loading={roleList.loading}
              options={roleList.data.map(role => ({ value: role.id, label: role.name }))}
            />
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue="ACTIVE">
            <Select
              options={[
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default UserPage
