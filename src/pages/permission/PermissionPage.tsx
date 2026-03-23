import React, { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, Space, Alert, Empty, Tag } from 'antd'
import { PlusOutlined, EditOutlined } from '@ant-design/icons'
import { permissionApi } from '@/api'
import { useList, useMutation } from '@/hooks/useApi'
import { useAuth } from '@/contexts/AuthContext'
import { PERMISSIONS } from '@/utils/permissions'
import PageHeader from '@/components/common/PageHeader'
import ConfirmDelete from '@/components/common/ConfirmDelete'
import StatusTag from '@/components/common/StatusTag'
import type { Permission, PermissionCreateRequest } from '@/types'

const PermissionPage: React.FC = () => {
  const { hasPermission } = useAuth()
  const { data, loading, error, fetch } = useList(() => permissionApi.listAll())
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Permission | null>(null)
  const [form] = Form.useForm()
  const [search, setSearch] = useState('')

  useEffect(() => { fetch() }, [])

  const createMut = useMutation(
    (req: PermissionCreateRequest) => permissionApi.create(req),
    { successMessage: 'Tạo quyền thành công', onSuccess: () => { setModalOpen(false); fetch() } }
  )
  const updateMut = useMutation(
    (args: { id: number; req: PermissionCreateRequest }) => permissionApi.update(args.id, args.req),
    { successMessage: 'Cập nhật thành công', onSuccess: () => { setModalOpen(false); fetch() } }
  )
  const deleteMut = useMutation(
    (id: number) => permissionApi.delete(id),
    { successMessage: 'Xóa thành công', onSuccess: () => fetch() }
  )

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true) }
  const openEdit = (r: Permission) => { setEditing(r); form.setFieldsValue(r); setModalOpen(true) }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    if (editing) await updateMut.execute({ id: editing.id, req: values })
    else await createMut.execute(values)
  }

  const filtered = data.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase())
  )

  const canCreate = hasPermission(PERMISSIONS.PERMISSION_CREATE)
  const canUpdate = hasPermission(PERMISSIONS.PERMISSION_UPDATE)
  const canDelete = hasPermission(PERMISSIONS.PERMISSION_DELETE)

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: 'Tên quyền', dataIndex: 'name', ellipsis: true },
    { title: 'Mã code', dataIndex: 'code', width: 220, render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: 'Mô tả', dataIndex: 'description', ellipsis: true, render: (v: string) => v || '—' },
    { title: 'Trạng thái', dataIndex: 'status', width: 120, render: (v: string) => <StatusTag status={v} /> },
    {
      title: 'Thao tác', width: 160, fixed: 'right' as const,
      render: (_: unknown, r: Permission) => (
        <Space>
          {canUpdate && <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>Sửa</Button>}
          {canDelete && <ConfirmDelete onConfirm={() => deleteMut.execute(r.id)} />}
        </Space>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Quyền hạn"
        subtitle={`${data.length} quyền`}
        extra={[
          <Input.Search key="s" placeholder="Tìm theo tên, code..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ width: 240 }} allowClear />,
          canCreate ? <Button key="c" type="primary" icon={<PlusOutlined />} onClick={openCreate}>Thêm quyền</Button> : null,
        ].filter(Boolean)}
      />
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
      <Table rowKey="id" columns={columns} dataSource={filtered} loading={loading}
        locale={{ emptyText: <Empty description="Chưa có quyền nào" /> }}
        pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (t) => `Tổng ${t} bản ghi` }}
        scroll={{ x: 900 }}
      />
      <Modal open={modalOpen} title={editing ? 'Sửa quyền' : 'Thêm quyền'}
        onCancel={() => setModalOpen(false)} onOk={handleSubmit}
        confirmLoading={createMut.loading || updateMut.loading}
        okText={editing ? 'Cập nhật' : 'Tạo mới'} cancelText="Hủy" destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Tên quyền" rules={[{ required: true, message: 'Vui lòng nhập tên quyền' }]}>
            <Input placeholder="Xem danh sách nhân viên" />
          </Form.Item>
          <Form.Item name="code" label="Mã code" rules={[
            { required: true, message: 'Vui lòng nhập mã code' },
            { pattern: /^[A-Z_]+$/, message: 'Chỉ dùng chữ HOA và dấu _' },
          ]}>
            <Input placeholder="VIEW_EMPLOYEE_LIST"
              onChange={e => form.setFieldValue('code', e.target.value.toUpperCase())} />
          </Form.Item>
          <Form.Item name="description" label="Mô tả"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="status" label="Trạng thái" initialValue="ACTIVE">
            <Select>
              <Select.Option value="ACTIVE">Hoạt động</Select.Option>
              <Select.Option value="INACTIVE">Vô hiệu</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default PermissionPage
