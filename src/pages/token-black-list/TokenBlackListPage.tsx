import React, { useEffect } from 'react'
import { Table, Typography } from 'antd'
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

  const canDelete = hasPermission(PERMISSIONS.TOKEN_DELETE)

  const { execute: remove } = useMutation((id: number) => tokenBlackListApi.delete(id), {
    successMessage: 'Delete token successfully',
    onSuccess: () => fetch(),
  })

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    {
      title: 'Token',
      dataIndex: 'token',
      render: (value: string) => (
        <Text
          code
          style={{
            fontSize: 11,
            maxWidth: 400,
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {value}
        </Text>
      ),
    },
    { title: 'Expired at', dataIndex: 'expiryDate', width: 180, render: (value?: string | null) => formatDateTime(value) },
    ...(canDelete
      ? [
          {
            title: 'Actions',
            width: 100,
            render: (_: unknown, record: TokenBlackList) => <ConfirmDelete onConfirm={() => remove(record.id)} />,
          },
        ]
      : []),
  ]

  return (
    <>
      <PageHeader title="Blocked tokens" subtitle={`${data.length} tokens`} />
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: total => `Total ${total} records` }}
        size="middle"
      />
    </>
  )
}

export default TokenBlackListPage
