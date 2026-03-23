import React from 'react'
import { App, Button } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'

interface ConfirmDeleteProps {
  onConfirm: () => void | Promise<unknown>
  loading?: boolean
  title?: string
  description?: string
  buttonSize?: 'small' | 'middle' | 'large'
}

const ConfirmDelete: React.FC<ConfirmDeleteProps> = ({
  onConfirm,
  loading,
  title = 'Confirm delete',
  description = 'This action cannot be undone.',
  buttonSize = 'small',
}) => {
  const { modal } = App.useApp()

  const handleConfirm = () =>
    modal.confirm({
      title,
      content: description,
      okText: 'Delete',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      onOk: onConfirm,
    })

  return (
    <Button
      danger
      size={buttonSize}
      icon={<DeleteOutlined />}
      loading={loading}
      onClick={handleConfirm}
    >
      Delete
    </Button>
  )
}

export default ConfirmDelete
