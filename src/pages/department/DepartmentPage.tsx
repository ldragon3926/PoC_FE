import React, { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Space, Alert, Empty } from 'antd'
import { PlusOutlined, EditOutlined } from '@ant-design/icons'
import { departmentApi } from '@/api'
import { useList, useMutation } from '@/hooks/useApi'
import { useAuth } from '@/contexts/AuthContext'
import { PERMISSIONS } from '@/utils/permissions'
import PageHeader from '@/components/common/PageHeader'
import ConfirmDelete from '@/components/common/ConfirmDelete'
import type { Department, DepartmentCreateRequest } from '@/types'

const DepartmentPage: React.FC = () => {
  const { hasPermission } = useAuth()
  const { data, loading, error, fetch } = useList(() => departmentApi.listAll())
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Department | null>(null)
  const [form] = Form.useForm()

  useEffect(() => { fetch() }, [])

  const createMut = useMutation(
    (req: DepartmentCreateRequest) => departmentApi.create(req),
    { successMessage: 'Tạo phòng ban thành công', onSuccess: () => { setModalOpen(false); fetch() } }
  )
  const updateMut = useMutation(
    (args: { id: number; req: DepartmentCreateRequest }) => departmentApi.update(args.id, args.req),
    { successMessage: 'Cập nhật thành công', onSuccess: () => { setModalOpen(false); fetch() } }
  )
  const deleteMut = useMutation(
    (id: number) => departmentApi.delete(id),
    { successMessage: 'Xóa thành công', onSuccess: () => fetch() }
  )

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true) }
  const openEdit = (r: Department) => { setEditing(r); form.setFieldsValue(r); setModalOpen(true) }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    if (editing) await updateMut.execute({ id: editing.id, req: values })
    else await createMut.execute(values)
  }

  const canCreate = hasPermission(PERMISSIONS.DEPARTMENT_CREATE)
  const canUpdate = hasPermission(PERMISSIONS.DEPARTMENT_UPDATE)
  const canDelete = hasPermission(PERMISSIONS.DEPARTMENT_DELETE)

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: 'Tên phòng ban', dataIndex: 'name', ellipsis: true },
    { title: 'Mô tả', dataIndex: 'description', ellipsis: true, render: (v: string) => v || '—' },
    {
      title: 'Thao tác', width: 160, fixed: 'right' as const,
      render: (_: unknown, record: Department) => (
        <Space>
          {canUpdate && <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>Sửa</Button>}
          {canDelete && <ConfirmDelete onConfirm={() => deleteMut.execute(record.id)} />}
        </Space>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Phòng ban"
        subtitle={`${data.length} phòng ban`}
        extra={canCreate ? [<Button key="c" type="primary" icon={<PlusOutlined />} onClick={openCreate}>Thêm phòng ban</Button>] : undefined}
      />
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
      <Table
        rowKey="id" columns={columns} dataSource={data} loading={loading}
        locale={{ emptyText: <Empty description="Chưa có phòng ban nào" /> }}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `Tổng ${t} bản ghi` }}
        scroll={{ x: 'max-content' }}
      />
      <Modal
        open={modalOpen} title={editing ? 'Sửa phòng ban' : 'Thêm phòng ban'}
        onCancel={() => setModalOpen(false)} onOk={handleSubmit}
        confirmLoading={createMut.loading || updateMut.loading}
        okText={editing ? 'Cập nhật' : 'Tạo mới'} cancelText="Hủy" destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Tên phòng ban" rules={[{ required: true, message: 'Vui lòng nhập tên phòng ban' }]}>
            <Input placeholder="VD: Phòng Kỹ thuật" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} placeholder="Mô tả phòng ban..." />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default DepartmentPage
