import React from 'react'
import { ConfigProvider, App as AntApp } from 'antd'
import viVN from 'antd/locale/vi_VN'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import AppRouter from '@/routes'

dayjs.locale('vi')

const App: React.FC = () => (
  <ConfigProvider
    locale={viVN}
    theme={{
      token: {
        fontFamily: "'Be Vietnam Pro', sans-serif",
        colorPrimary: '#1677ff',
        borderRadius: 8,
        fontSize: 14,
      },
      components: {
        Layout: {
          bodyBg: '#f5f6fa',
        },
        Menu: {
          itemBorderRadius: 8,
          itemMarginInline: 8,
        },
        Table: {
          headerBg: '#fafafa',
        },
      },
    }}
  >
    <AntApp>
      <AppRouter />
    </AntApp>
  </ConfigProvider>
)

export default App
