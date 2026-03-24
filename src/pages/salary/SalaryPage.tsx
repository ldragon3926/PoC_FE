import React, { useEffect, useMemo, useState } from 'react'
import { Alert, App, Button, Empty, Form, Input, InputNumber, Modal, Select, Space, Table, Tag } from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined, ThunderboltOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { contractApi, employeeApi, rewardApi, salaryApi } from '@/api'
import ConfirmDelete from '@/components/common/ConfirmDelete'
import PageHeader from '@/components/common/PageHeader'
import { useAuth } from '@/contexts/AuthContext'
import { useList, useMutation } from '@/hooks/useApi'
import type { ApiResponse, Contract, Employee, Reward, Salary, SalaryCreateRequest } from '@/types'
import { formatCurrency, formatDate, getEmployeeDisplayName } from '@/utils/format'
import { PERMISSIONS } from '@/utils/permissions'

const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1)

const toNumber = (value: unknown) => {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim()) return Number(value)
  return 0
}

const computeTotalSalary = (baseSalary: unknown, allowance: unknown, deduction: unknown) =>
  toNumber(baseSalary) + toNumber(allowance) - toNumber(deduction)

const computeTotalSalaryWithReward = (
  baseSalary: unknown,
  allowance: unknown,
  rewardAmount: unknown,
  deduction: unknown
) => toNumber(baseSalary) + toNumber(allowance) + toNumber(rewardAmount) - toNumber(deduction)

const getRewardAllowance = (
  rewards: Reward[],
  employeeId?: number,
  month?: number,
  year?: number
) => {
  if (!employeeId || !month || !year) return 0

  const employeeRewards = rewards.filter(reward => reward.employeeId === employeeId)
  if (!employeeRewards.length) return 0

  const matchedRewards = employeeRewards.filter(reward => {
    if (!reward.createdAt) return false
    const rewardDate = dayjs(reward.createdAt)
    return rewardDate.isValid() && rewardDate.month() + 1 === month && rewardDate.year() === year
  })

  const source = matchedRewards.length ? matchedRewards : employeeRewards
  return source.reduce((total, reward) => total + toNumber(reward.amount), 0)
}

const getPreferredContract = (contracts: Contract[], employeeId?: number) => {
  if (!employeeId) return null

  const employeeContracts = contracts.filter(contract => contract.employeeId === employeeId)
  if (!employeeContracts.length) return null

  return employeeContracts.sort((left, right) => {
    const leftDate = dayjs(left.endDate || left.startDate || '1900-01-01').valueOf()
    const rightDate = dayjs(right.endDate || right.startDate || '1900-01-01').valueOf()
    return rightDate - leftDate
  })[0]
}

const normalizeSalaryStatus = (status?: Salary['status']) => (status ?? 'DRAFT').toUpperCase()

const isDraftSalary = (status?: Salary['status']) => normalizeSalaryStatus(status) === 'DRAFT'

const salaryStatusColor = (status?: Salary['status']) => {
  const normalized = normalizeSalaryStatus(status)
  if (normalized === 'PAID') return 'success'
  if (normalized === 'FINALIZED') return 'processing'
  return 'default'
}

type SalaryListFilters = {
  keyword?: string
  employeeId?: number
  month?: number
  year?: number
  status?: Salary['status']
}

const SalaryPage: React.FC = () => {
  const { modal, message } = App.useApp()
  const { hasPermission } = useAuth()
  const [appliedFilters, setAppliedFilters] = useState<SalaryListFilters>({})
  const salaryFetcher = React.useCallback(() => salaryApi.listAll(appliedFilters), [appliedFilters])
  const { data, loading, error, fetch } = useList(salaryFetcher)
  const employeeList = useList(() => employeeApi.listAll())
  const contractList = useList(() => contractApi.listAll())
  const rewardList = useList(() => rewardApi.listAll())
  const [keyword, setKeyword] = useState('')
  const [filterEmployeeId, setFilterEmployeeId] = useState<number | undefined>(undefined)
  const [filterMonth, setFilterMonth] = useState<number | undefined>(undefined)
  const [filterYear, setFilterYear] = useState<number | undefined>(undefined)
  const [filterStatus, setFilterStatus] = useState<Salary['status'] | undefined>(undefined)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Salary | null>(null)
  const [finalizeMonth, setFinalizeMonth] = useState(dayjs().month() + 1)
  const [finalizeYear, setFinalizeYear] = useState(dayjs().year())
  const [form] = Form.useForm()

  useEffect(() => {
    fetch()
  }, [fetch])

  useEffect(() => {
    employeeList.fetch()
    contractList.fetch()
    rewardList.fetch()
  }, [])

  useEffect(() => {
    if (!modalOpen || editing) return

    const employeeId = form.getFieldValue('employeeId')
    const month = form.getFieldValue('month')
    const year = form.getFieldValue('year')

    if (employeeId && month && year) {
      syncSalaryForm(employeeId, month, year)
    }
  }, [modalOpen, editing, contractList.data, rewardList.data])

  const empMap = useMemo(() => {
    const map: Record<number, string> = {}
    employeeList.data.forEach((employee: Employee) => {
      map[employee.id] = employee.name
    })
    return map
  }, [employeeList.data])

  const createMut = useMutation((req: SalaryCreateRequest) => salaryApi.create(req), {
    successMessage: 'Create salary successfully',
    onSuccess: () => {
      setModalOpen(false)
      fetch()
    },
  })

  const updateMut = useMutation(
    (args: { id: number; req: SalaryCreateRequest }) => salaryApi.update(args.id, args.req),
    {
      successMessage: 'Update salary successfully',
      onSuccess: () => {
        setModalOpen(false)
        fetch()
      },
    }
  )

  const deleteMut = useMutation((id: number) => salaryApi.delete(id), {
    successMessage: 'Delete salary successfully',
    onSuccess: () => fetch(),
  })

  const finalizeMut = useMutation(
    (args: { month: number; year: number }) => salaryApi.finalizeMonth(args.month, args.year),
    {
      onSuccess: (result: ApiResponse<number>) => {
        message.success(result.message || 'Finalize salary period successfully')
        fetch()
      },
    }
  )

  const generateMut = useMutation(
    (args: { month: number; year: number; overwriteDraft: boolean }) =>
      salaryApi.generateMonth(args.month, args.year, args.overwriteDraft),
    {
      onSuccess: (result: ApiResponse<number>) => {
        message.success(result.message || 'Generate salary period successfully')
        fetch()
      },
    }
  )

  const openCreate = () => {
    setEditing(null)
    form.setFieldsValue({
      month: dayjs().month() + 1,
      year: dayjs().year(),
      allowance: 0,
      rewardAmount: 0,
      deduction: 0,
      totalSalary: 0,
    })
    setModalOpen(true)
  }

  const openEdit = (record: Salary) => {
    setEditing(record)
    form.setFieldsValue(record)
    setModalOpen(true)
  }

  const syncSalaryForm = (employeeId?: number, month?: number, year?: number) => {
    if (!employeeId || editing) return

    const matchedContract = getPreferredContract(contractList.data, employeeId)
    const rewardAmount = getRewardAllowance(
      rewardList.data,
      employeeId,
      month ?? form.getFieldValue('month'),
      year ?? form.getFieldValue('year')
    )

    if (!matchedContract) {
      form.setFieldValue('baseSalary', undefined)
      form.setFieldsValue({
        rewardAmount,
        totalSalary: computeTotalSalaryWithReward(
          undefined,
          form.getFieldValue('allowance'),
          rewardAmount,
          form.getFieldValue('deduction')
        ),
      })
      return
    }

    const nextBaseSalary = Number(matchedContract.baseSalary || 0)
    form.setFieldsValue({
      baseSalary: nextBaseSalary,
      rewardAmount,
      totalSalary: computeTotalSalaryWithReward(
        nextBaseSalary,
        form.getFieldValue('allowance'),
        rewardAmount,
        form.getFieldValue('deduction')
      ),
    })
  }

  const handleValuesChange = (changedValues: Partial<SalaryCreateRequest>) => {
    if ('employeeId' in changedValues || 'month' in changedValues || 'year' in changedValues) {
      const values = form.getFieldsValue(['employeeId', 'month', 'year'])
      syncSalaryForm(
        changedValues.employeeId ?? values.employeeId,
        changedValues.month ?? values.month,
        changedValues.year ?? values.year
      )
      return
    }

    if ('baseSalary' in changedValues || 'allowance' in changedValues || 'deduction' in changedValues) {
      const values = form.getFieldsValue(['baseSalary', 'allowance', 'rewardAmount', 'deduction'])
      form.setFieldValue(
        'totalSalary',
        computeTotalSalaryWithReward(values.baseSalary, values.allowance, values.rewardAmount, values.deduction)
      )
    }
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    const { rewardAmount, status, ...restValues } = values
    const req: SalaryCreateRequest = {
      ...restValues,
      totalSalary: computeTotalSalaryWithReward(
        values.baseSalary,
        values.allowance,
        rewardAmount,
        values.deduction
      ),
    }

    if (editing) {
      await updateMut.execute({ id: editing.id, req })
      return
    }
    await createMut.execute(req)
  }

  const canCreate = hasPermission(PERMISSIONS.SALARY_CREATE)
  const canUpdate = hasPermission(PERMISSIONS.SALARY_UPDATE)
  const canDelete = hasPermission(PERMISSIONS.SALARY_DELETE)
  const canFinalize = canUpdate

  const triggerGenerate = () => {
    if (finalizeMonth < 1 || finalizeMonth > 12) {
      message.error('Month must be between 1 and 12')
      return
    }
    if (finalizeYear < 2000 || finalizeYear > 3000) {
      message.error('Year must be between 2000 and 3000')
      return
    }

    modal.confirm({
      title: `Generate salary period ${finalizeMonth}/${finalizeYear}?`,
      content: 'This will auto-calculate salary by attendance days and reward in the selected period. Existing DRAFT records are kept.',
      okText: 'Generate',
      cancelText: 'Cancel',
      onOk: async () => {
        await generateMut.execute({ month: finalizeMonth, year: finalizeYear, overwriteDraft: false })
      },
    })
  }

  const triggerFinalize = () => {
    if (finalizeMonth < 1 || finalizeMonth > 12) {
      message.error('Month must be between 1 and 12')
      return
    }
    if (finalizeYear < 2000 || finalizeYear > 3000) {
      message.error('Year must be between 2000 and 3000')
      return
    }

    modal.confirm({
      title: `Finalize salary period ${finalizeMonth}/${finalizeYear}?`,
      content: 'After finalize, salary records in this period cannot be edited or deleted.',
      okText: 'Finalize',
      cancelText: 'Cancel',
      onOk: async () => {
        await finalizeMut.execute({ month: finalizeMonth, year: finalizeYear })
      },
    })
  }

  const applyFilters = () => {
    setAppliedFilters({
      keyword: keyword.trim() || undefined,
      employeeId: filterEmployeeId,
      month: filterMonth,
      year: filterYear,
      status: filterStatus,
    })
  }

  const resetFilters = () => {
    setKeyword('')
    setFilterEmployeeId(undefined)
    setFilterMonth(undefined)
    setFilterYear(undefined)
    setFilterStatus(undefined)
    setAppliedFilters({})
  }

  const numFmt = {
    formatter: (value: number | undefined) => `${value ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, ','),
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    {
      title: 'Employee',
      dataIndex: 'employeeName',
      ellipsis: true,
      render: (_: unknown, record: Salary) => getEmployeeDisplayName(record as unknown as Record<string, unknown>, empMap),
    },
    { title: 'Month/Year', width: 110, render: (_: unknown, record: Salary) => `${record.month}/${record.year}` },
    { title: 'Base salary', dataIndex: 'baseSalary', width: 150, render: (value?: number | null) => formatCurrency(value) },
    { title: 'Allowance', dataIndex: 'allowance', width: 130, render: (value?: number | null) => formatCurrency(value) },
    { title: 'Deduction', dataIndex: 'deduction', width: 130, render: (value?: number | null) => formatCurrency(value) },
    {
      title: 'Total salary',
      dataIndex: 'totalSalary',
      width: 150,
      render: (value?: number | null) => <strong>{formatCurrency(value)}</strong>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 120,
      render: (value?: Salary['status']) => <Tag color={salaryStatusColor(value)}>{normalizeSalaryStatus(value)}</Tag>,
    },
    { title: 'Created at', dataIndex: 'createdAt', width: 110, render: (value?: string | null) => formatDate(value) },
    {
      title: 'Actions',
      width: 160,
      fixed: 'right' as const,
      render: (_: unknown, record: Salary) => {
        const canEditThisRecord = isDraftSalary(record.status)

        return (
          <Space>
            {canUpdate && (
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => openEdit(record)}
                disabled={!canEditThisRecord}
              >
                Edit
              </Button>
            )}
            {canDelete &&
              (canEditThisRecord ? (
                <ConfirmDelete onConfirm={() => deleteMut.execute(record.id)} />
              ) : (
                <Button danger size="small" icon={<DeleteOutlined />} disabled>
                  Delete
                </Button>
              ))}
          </Space>
        )
      },
    },
  ]

  return (
    <>
      <PageHeader
        title="Salary"
        subtitle={`${data.length} records`}
        extra={
          (() => {
            const actions: React.ReactNode[] = []
            if (canFinalize) {
              actions.push(
                <Space key="finalize">
                  <Select
                    value={finalizeMonth}
                    onChange={setFinalizeMonth}
                    style={{ width: 110 }}
                    options={MONTHS.map(month => ({ value: month, label: `Month ${month}` }))}
                  />
                  <InputNumber
                    value={finalizeYear}
                    onChange={value => setFinalizeYear(value ?? dayjs().year())}
                    min={2000}
                    max={3000}
                    style={{ width: 120 }}
                  />
                  <Button icon={<ThunderboltOutlined />} onClick={triggerGenerate} loading={generateMut.loading}>
                    Generate
                  </Button>
                  <Button onClick={triggerFinalize} loading={finalizeMut.loading}>
                    Finalize period
                  </Button>
                </Space>
              )
            }
            if (canCreate) {
              actions.push(
                <Button key="create" type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                  Add salary
                </Button>
              )
            }
            return actions.length > 0 ? actions : undefined
          })()
        }
      />
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
      <Space wrap style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search employee name/email"
          value={keyword}
          onChange={event => setKeyword(event.target.value)}
          allowClear
          style={{ width: 240 }}
          onPressEnter={applyFilters}
        />
        <Select
          placeholder="Employee"
          allowClear
          showSearch
          optionFilterProp="label"
          value={filterEmployeeId}
          onChange={value => setFilterEmployeeId(value)}
          style={{ width: 220 }}
          options={employeeList.data.map(employee => ({
            value: employee.id,
            label: employee.name,
          }))}
        />
        <Select
          placeholder="Month"
          allowClear
          value={filterMonth}
          onChange={value => setFilterMonth(value)}
          style={{ width: 120 }}
          options={MONTHS.map(month => ({ value: month, label: `Month ${month}` }))}
        />
        <InputNumber
          placeholder="Year"
          value={filterYear}
          onChange={value => setFilterYear(value ?? undefined)}
          min={2000}
          max={3000}
          style={{ width: 120 }}
        />
        <Select
          placeholder="Status"
          allowClear
          value={filterStatus}
          onChange={value => setFilterStatus(value)}
          style={{ width: 140 }}
          options={[
            { value: 'DRAFT', label: 'DRAFT' },
            { value: 'FINALIZED', label: 'FINALIZED' },
            { value: 'PAID', label: 'PAID' },
          ]}
        />
        <Button type="primary" onClick={applyFilters}>
          Search
        </Button>
        <Button onClick={resetFilters}>Reset</Button>
      </Space>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        locale={{ emptyText: <Empty description="No salary data" /> }}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: total => `Total ${total} records` }}
        scroll={{ x: 1220 }}
      />
      <Modal
        open={modalOpen}
        title={editing ? 'Edit salary' : 'Add salary'}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={createMut.loading || updateMut.loading}
        okText={editing ? 'Update' : 'Create'}
        cancelText="Cancel"
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }} onValuesChange={handleValuesChange}>
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
          <Space style={{ width: '100%' }}>
            <Form.Item
              name="month"
              label="Month"
              rules={[
                { required: true, message: 'Please select month' },
                { type: 'number', min: 1, max: 12, message: 'Month must be between 1 and 12' },
              ]}
              style={{ flex: 1 }}
            >
              <Select options={MONTHS.map(month => ({ value: month, label: `Month ${month}` }))} />
            </Form.Item>
            <Form.Item
              name="year"
              label="Year"
              rules={[
                { required: true, message: 'Please input year' },
                { type: 'number', min: 2000, max: 3000, message: 'Year must be between 2000 and 3000' },
              ]}
              style={{ flex: 1 }}
            >
              <InputNumber style={{ width: '100%' }} min={2000} max={3000} />
            </Form.Item>
          </Space>
          <Form.Item
            name="baseSalary"
            label="Base salary"
            rules={[{ required: true, message: 'Base salary will be loaded from the employee contract' }]}
            extra={!editing ? 'Auto-filled from the latest contract of the selected employee.' : undefined}
          >
            <InputNumber style={{ width: '100%' }} min={0} step={500000} {...numFmt} />
          </Form.Item>
          <Form.Item
            name="allowance"
            label="Allowance"
            initialValue={0}
            extra="Manual allowance."
          >
            <InputNumber style={{ width: '100%' }} min={0} step={100000} {...numFmt} />
          </Form.Item>
          <Form.Item
            name="rewardAmount"
            label="Reward"
            initialValue={0}
            extra={!editing ? 'Auto-filled from rewards of the selected employee in the selected month/year.' : undefined}
          >
            <InputNumber style={{ width: '100%' }} min={0} step={100000} {...numFmt} readOnly />
          </Form.Item>
          <Form.Item name="deduction" label="Deduction" initialValue={0}>
            <InputNumber style={{ width: '100%' }} min={0} step={100000} {...numFmt} />
          </Form.Item>
          <Form.Item
            name="totalSalary"
            label="Total salary"
            rules={[{ required: true }]}
            extra="Automatically calculated as base salary + allowance + reward - deduction."
          >
            <InputNumber style={{ width: '100%' }} min={0} step={500000} {...numFmt} readOnly />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default SalaryPage
