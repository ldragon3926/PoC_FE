import React, { useEffect, useState } from 'react'
import { Alert, Button, Empty, Form, Input, Modal, Select, Space, Table, Tag } from 'antd'
import { EditOutlined, PlusOutlined } from '@ant-design/icons'
import { permissionApi, roleApi } from '@/api'
import ConfirmDelete from '@/components/common/ConfirmDelete'
import PageHeader from '@/components/common/PageHeader'
import StatusTag from '@/components/common/StatusTag'
import { useAuth } from '@/contexts/AuthContext'
import { useList, useMutation } from '@/hooks/useApi'
import type { Permission, Role, RoleCreateRequest } from '@/types'
import { PERMISSIONS } from '@/utils/permissions'

type PermissionOption = {
  id: React.Key
  label: string
}

const RolePage: React.FC = () => {
  const { hasPermission } = useAuth()
  const { data, loading, error, fetch } = useList(() => roleApi.listAll())
  const permList = useList(() => permissionApi.listAll())
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Role | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetch()
    permList.fetch()
  }, [])

  const createMut = useMutation((req: RoleCreateRequest) => roleApi.create(req), {
    successMessage: 'Create role successfully',
    onSuccess: () => {
      setModalOpen(false)
      fetch()
    },
  })

  const updateMut = useMutation(
    (args: { id: number; req: RoleCreateRequest }) => roleApi.update(args.id, args.req),
    {
      successMessage: 'Update role successfully',
      onSuccess: () => {
        setModalOpen(false)
        fetch()
      },
    }
  )

  const deleteMut = useMutation((id: number) => roleApi.delete(id), {
    successMessage: 'Delete role successfully',
    onSuccess: () => fetch(),
  })

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (record: Role) => {
    const selectedPermissionIds =
      record.idPermissions ||
      record.idPermission ||
      record.permissions?.map(permission => permission.id).filter((id): id is number => typeof id === 'number') ||
      []

    setEditing(record)
    form.setFieldsValue({
      ...record,
      idPermissions: selectedPermissionIds,
    })
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

  const canCreate = hasPermission(PERMISSIONS.ROLE_CREATE)
  const canUpdate = hasPermission(PERMISSIONS.ROLE_UPDATE)
  const canDelete = hasPermission(PERMISSIONS.ROLE_DELETE)

  const getPermissionLabels = (record: Role): PermissionOption[] => {
    const labelsFromObjects =
      record.permissions
        ?.map(permission => ({
          id: permission.id ?? permission.code,
          label: permission.name || permission.code || `${permission.id ?? ''}`,
        }))
        .filter(permission => permission.id !== undefined && permission.label.trim()) || []

    if (labelsFromObjects.length) {
      return labelsFromObjects
    }

    const labelsFromNames = [...(record.permissionNames || []), ...(record.permissionsName || [])]
      .map(name => name?.trim())
      .filter((name): name is string => Boolean(name))
      .map((name, index) => ({
        id: `name-${index}-${name}`,
        label: name,
      }))

    if (labelsFromNames.length) {
      return labelsFromNames
    }

    const labelsFromCodes = (record.permissionCodes || [])
      .map(code => code?.trim())
      .filter((code): code is string => Boolean(code))
      .map((code, index) => ({
        id: `code-${index}-${code}`,
        label: code,
      }))

    if (labelsFromCodes.length) {
      return labelsFromCodes
    }

    const permissionIds = record.idPermissions || record.idPermission || []
    if (permissionIds.length) {
      return permissionIds.map(id => {
        const permission = permList.data.find(item => item.id === id)
        return {
          id,
          label: permission?.name || permission?.code || `${id}`,
        }
      })
    }

    return []
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: 'Role name', dataIndex: 'name', ellipsis: true },
    { title: 'Code', dataIndex: 'code', width: 160, render: (value: string) => <Tag>{value}</Tag> },
    { title: 'Description', dataIndex: 'description', ellipsis: true, render: (value?: string) => value || '-' },
    {
      title: 'Permissions',
      dataIndex: 'permissions',
      width: 200,
      render: (_: unknown, record: Role) => {
        const permissions = getPermissionLabels(record)
        if (!permissions.length) return '-'

        const visible = permissions.slice(0, 2)
        const rest = permissions.length - 2

        return (
          <>
            {visible.map(permission => {
              return (
                <Tag key={permission.id} color="cyan" style={{ marginBottom: 2 }}>
                  {permission.label}
                </Tag>
              )
            })}
            {rest > 0 && <Tag>+{rest}</Tag>}
          </>
        )
      },
    },
    { title: 'Status', dataIndex: 'status', width: 120, render: (value: string) => <StatusTag status={value} /> },
    {
      title: 'Actions',
      width: 160,
      fixed: 'right' as const,
      render: (_: unknown, record: Role) => (
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
        title="Roles"
        subtitle={`${data.length} roles`}
        extra={
          canCreate
            ? [
                <Button key="create" type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                  Add role
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
        locale={{ emptyText: <Empty description="No roles" /> }}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: total => `Total ${total} records` }}
        scroll={{ x: 1000 }}
      />
      <Modal
        open={modalOpen}
        title={editing ? 'Edit role' : 'Add role'}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={createMut.loading || updateMut.loading}
        okText={editing ? 'Update' : 'Create'}
        cancelText="Cancel"
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Role name" rules={[{ required: true, message: 'Please enter role name' }]}>
            <Input placeholder="Administrator" />
          </Form.Item>
          <Form.Item
            name="code"
            label="Code"
            rules={[
              { required: true, message: 'Please enter role code' },
              { pattern: /^[A-Z_]+$/, message: 'Use uppercase letters and underscore only' },
            ]}
          >
            <Input
              placeholder="ADMIN"
              style={{ textTransform: 'uppercase' }}
              onChange={event => form.setFieldValue('code', event.target.value.toUpperCase())}
            />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Role description" />
          </Form.Item>
          <Form.Item name="idPermissions" label="Permissions">
            <Select
              mode="multiple"
              placeholder="Select permissions"
              allowClear
              loading={permList.loading}
              showSearch
              optionFilterProp="label"
              options={permList.data.map(permission => ({
                value: permission.id,
                label: permission.name,
              }))}
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

export default RolePage
