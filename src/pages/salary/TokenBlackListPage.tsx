import React, { useEffect, useState } from 'react'
import { Space, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { tokenBlackListApi } from '@/api'
import ConfirmDelete from '@/components/common/ConfirmDelete'
import PageHeader from '@/components/common/PageHeader'
import { useAuth } from '@/contexts/AuthContext'
import { useList, useMutation } from '@/hooks/useApi'
import type { TokenBlackList } from '@/types'
import { formatDateTime } from '@/utils/format'
import { PERMISSIONS } from '@/utils/permissions'

const TokenBlackListPage: React.FC = () => {
  const { hasPermission } = useAuth()
  const { data, loading, fetch } = useList(() => tokenBlackListApi.listAll())
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    fetch()
  }, [fetch])

  const deleteMutation = useMutation((id: number) => tokenBlackListApi.delete(id), {
    successMessage: 'Delete token successfully',
    onSuccess: () => fetch(),
  })

  const filtered = data.filter(item => !searchText || item.token?.toLowerCase().includes(searchText.toLowerCase()))

  const columns: ColumnsType<TokenBlackList> = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    {
      title: 'Token',
      dataIndex: 'token',
      ellipsis: true,
      render: (value: string) => <code style={{ fontSize: 11, color: '#888' }}>{value?.slice(0, 40)}...</code>,
    },
    { title: 'Expired at', dataIndex: 'expiryDate', render: (value?: string | null) => formatDateTime(value) },
    {
      title: 'Actions',
      width: 100,
      render: (_: unknown, record: TokenBlackList) => (
        <Space>
          {hasPermission(PERMISSIONS.TOKEN_DELETE) && (
            <ConfirmDelete onConfirm={() => deleteMutation.execute(record.id)} />
          )}
        </Space>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Blocked tokens"
        subtitle="Disabled JWT tokens"
        extra={[
          <input
            key="search"
            placeholder="Search token..."
            style={{ padding: '4px 8px', border: '1px solid #d9d9d9', borderRadius: 6, width: 260 }}
            onChange={event => setSearchText(event.target.value)}
          />,
        ]}
      />
      <Table
        rowKey="id"
        columns={columns}
        dataSource={filtered}
        loading={loading}
        size="middle"
        pagination={{ pageSize: 20, showTotal: total => `Total ${total} records` }}
      />
    </>
  )
}

export default TokenBlackListPage
