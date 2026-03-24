import React, { useEffect, useState } from 'react'
import {
  App,
  Alert,
  Button,
  DatePicker,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  TimePicker,
} from 'antd'
import { EditOutlined, PlusOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { attendanceApi, employeeApi, userApi } from '@/api'
import ConfirmDelete from '@/components/common/ConfirmDelete'
import PageHeader from '@/components/common/PageHeader'
import { useAuth } from '@/contexts/AuthContext'
import { useList, useMutation } from '@/hooks/useApi'
import type { Attendance, AttendanceCreateRequest, Employee } from '@/types'
import { formatDate, getEmployeeDisplayName } from '@/utils/format'
import { PERMISSIONS } from '@/utils/permissions'

const calculateWorkingHours = (checkIn?: dayjs.Dayjs, checkOut?: dayjs.Dayjs) => {
  if (!checkIn || !checkOut) return undefined

  const diffMinutes = checkOut.diff(checkIn, 'minute')
  if (diffMinutes < 0) return undefined

  return Number((diffMinutes / 60).toFixed(2))
}

const AttendancePage: React.FC = () => {
  const { message } = App.useApp()
  const { user, hasPermission } = useAuth()
  const { data, loading, error, fetch } = useList(() => attendanceApi.listAll())
  const employeeList = useList(() => employeeApi.listAll())
  const [selfEmployee, setSelfEmployee] = useState<{ id: number; name: string } | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Attendance | null>(null)
  const [form] = Form.useForm()
  const canListEmployees = hasPermission(PERMISSIONS.EMPLOYEE_LIST)

  useEffect(() => {
    fetch()
    if (hasPermission(PERMISSIONS.EMPLOYEE_LIST)) {
      employeeList.fetch()
      return
    }
    if (!user?.userId) {
      setSelfEmployee(null)
      return
    }

    userApi
      .detail(user.userId)
      .then((response) => {
        const detail = response.data as { employeeId?: number; employeeName?: string; username?: string }
        if (detail.employeeId) {
          setSelfEmployee({
            id: detail.employeeId,
            name: detail.employeeName || detail.username || `Employee ${detail.employeeId}`,
          })
        }
      })
      .catch(() => {
        setSelfEmployee(null)
      })
  }, [user?.userId, hasPermission(PERMISSIONS.EMPLOYEE_LIST)])

  const empMap = React.useMemo(() => {
    const map: Record<number, string> = {}
    employeeList.data.forEach((employee: Employee) => {
      map[employee.id] = employee.name
    })
    return map
  }, [employeeList.data])

  const createMut = useMutation((req: AttendanceCreateRequest) => attendanceApi.create(req), {
    successMessage: 'Create attendance successfully',
    onSuccess: () => {
      setModalOpen(false)
      fetch()
    },
  })

  const updateMut = useMutation(
    (args: { id: number; req: AttendanceCreateRequest }) => attendanceApi.update(args.id, args.req),
    {
      successMessage: 'Update attendance successfully',
      onSuccess: () => {
        setModalOpen(false)
        fetch()
      },
    }
  )

  const deleteMut = useMutation((id: number) => attendanceApi.delete(id), {
    successMessage: 'Delete attendance successfully',
    onSuccess: () => fetch(),
  })

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    if (selfEmployee) {
      form.setFieldValue('employeeId', selfEmployee.id)
    }
    setModalOpen(true)
  }

  useEffect(() => {
    if (!modalOpen || editing || canListEmployees || !selfEmployee) return
    form.setFieldValue('employeeId', selfEmployee.id)
  }, [modalOpen, editing, canListEmployees, selfEmployee, form])

  const openEdit = (record: Attendance) => {
    const checkIn = record.checkIn ? dayjs(record.checkIn, 'HH:mm') : undefined
    const checkOut = record.checkOut ? dayjs(record.checkOut, 'HH:mm') : undefined
    setEditing(record)
    form.setFieldsValue({
      ...record,
      workDate: record.workDate ? dayjs(record.workDate) : undefined,
      checkIn,
      checkOut,
      workingHours: record.workingHours ?? calculateWorkingHours(checkIn, checkOut),
    })
    setModalOpen(true)
  }

  const handleValuesChange = () => {
    const checkIn = form.getFieldValue('checkIn')
    const checkOut = form.getFieldValue('checkOut')
    form.setFieldValue('workingHours', calculateWorkingHours(checkIn, checkOut))
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    const resolvedEmployeeId = values.employeeId ?? selfEmployee?.id
    if (!resolvedEmployeeId) {
      message.error('Can not detect employee profile for this account')
      return
    }
    const req: AttendanceCreateRequest = {
      ...values,
      employeeId: resolvedEmployeeId,
      workDate: values.workDate?.format('YYYY-MM-DD'),
      checkIn: values.checkIn?.format('HH:mm'),
      checkOut: values.checkOut?.format('HH:mm'),
    }

    if (editing) {
      await updateMut.execute({ id: editing.id, req })
      return
    }

    await createMut.execute(req)
  }

  const canCreate = hasPermission(PERMISSIONS.ATTENDANCE_CREATE)
  const canUpdate = hasPermission(PERMISSIONS.ATTENDANCE_UPDATE)
  const canDelete = hasPermission(PERMISSIONS.ATTENDANCE_DELETE)

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    {
      title: 'Employee',
      dataIndex: 'employeeName',
      ellipsis: true,
      render: (_: unknown, record: Attendance) => getEmployeeDisplayName(record as unknown as Record<string, unknown>, empMap),
    },
    { title: 'Work date', dataIndex: 'workDate', width: 120, render: (value?: string | null) => formatDate(value) },
    { title: 'Check in', dataIndex: 'checkIn', width: 100, render: (value?: string) => value || '-' },
    { title: 'Check out', dataIndex: 'checkOut', width: 100, render: (value?: string) => value || '-' },
    { title: 'Hours', dataIndex: 'workingHours', width: 100, render: (value?: number) => (value != null ? `${value}h` : '-') },
    {
      title: 'Actions',
      width: 160,
      fixed: 'right' as const,
      render: (_: unknown, record: Attendance) => (
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
        title="Attendance"
        subtitle={`${data.length} records`}
        extra={
          canCreate
            ? [
                <Button key="create" type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                  Add attendance
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
        locale={{ emptyText: <Empty description="No attendance data" /> }}
        pagination={{ pageSize: 15, showSizeChanger: true, showTotal: total => `Total ${total} records` }}
        scroll={{ x: 900 }}
      />
      <Modal
        open={modalOpen}
        title={editing ? 'Edit attendance' : 'Add attendance'}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={createMut.loading || updateMut.loading}
        okText={editing ? 'Update' : 'Create'}
        cancelText="Cancel"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }} onValuesChange={handleValuesChange}>
          {canListEmployees ? (
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
          ) : (
            <>
              <Form.Item name="employeeId" hidden rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item label="Employee">
                <Input value={selfEmployee?.name ?? user?.username ?? '-'} readOnly />
              </Form.Item>
            </>
          )}
          <Form.Item
            name="workDate"
            label="Work date"
            rules={[{ required: true, message: 'Please select work date' }]}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="checkIn" label="Check in">
            <TimePicker style={{ width: '100%' }} format="HH:mm" />
          </Form.Item>
          <Form.Item name="checkOut" label="Check out">
            <TimePicker style={{ width: '100%' }} format="HH:mm" />
          </Form.Item>
          <Form.Item name="workingHours" label="Working hours">
            <InputNumber style={{ width: '100%' }} min={0} max={24} step={0.5} readOnly />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default AttendancePage
