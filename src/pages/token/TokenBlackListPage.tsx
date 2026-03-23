import React, { useEffect } from 'react'
import { Alert, Empty, Table, Typography } from 'antd'
import { tokenBlackListApi } from '@/api'
import ConfirmDelete from '@/components/common/ConfirmDelete'
import PageHeader from '@/components/common/PageHeader'
import { useAuth } from '@/contexts/AuthContext'
import { useList, useMutation } from '@/hooks/useApi'
import type { TokenBlackList } from '@/types'
import { formatDateTime } from '@/utils/format'
import { PERMISSIONS } from '@/utils/permissions'

const { Text } = Typography

const TokenBlackListPage: React.FC = () => {
  const { hasPermission } = useAuth()
  const { data, loading, error, fetch } = useList(() => tokenBlackListApi.listAll())

  useEffect(() => {
    fetch()
  }, [])

  const deleteMut = useMutation((id: number) => tokenBlackListApi.delete(id), {
    successMessage: 'Delete token successfully',
    onSuccess: () => fetch(),
  })

  const canDelete = hasPermission(PERMISSIONS.TOKEN_DELETE)

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    {
      title: 'Token',
      dataIndex: 'token',
      ellipsis: true,
      render: (value: string) => <Text code style={{ fontSize: 12 }}>{value.substring(0, 40)}...</Text>,
    },
    { title: 'Expired at', dataIndex: 'expiryDate', width: 160, render: (value?: string | null) => formatDateTime(value) },
    {
      title: 'Actions',
      width: 100,
      fixed: 'right' as const,
      render: (_: unknown, record: TokenBlackList) =>
        canDelete ? (
          <ConfirmDelete
            onConfirm={() => deleteMut.execute(record.id)}
            title="Delete token"
            description="Do you want to remove this token?"
          />
        ) : null,
    },
  ]

  return (
    <>
      <PageHeader title="Blocked token list" subtitle={`${data.length} tokens`} />
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        locale={{ emptyText: <Empty description="No blocked tokens" /> }}
        pagination={{ pageSize: 15, showSizeChanger: true, showTotal: total => `Total ${total} records` }}
        scroll={{ x: 700 }}
      />
    </>
  )
}

export default TokenBlackListPage
