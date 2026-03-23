# HRM Frontend

Admin dashboard cho hệ thống quản lý lương/nhân sự — React + TypeScript + Vite + Ant Design.

## Cài đặt & Chạy

```bash
npm install
npm run dev     # Chạy dev tại http://localhost:5173
npm run build   # Build production
```

> Vite proxy: /api/* → http://localhost:8080. Đổi cổng trong vite.config.ts nếu cần.

## Cấu trúc thư mục

```
src/
├── api/
│   ├── client.ts        # Axios + token storage + interceptors + createCrudApi factory
│   └── index.ts         # Tất cả API services
├── contexts/
│   └── AuthContext.tsx  # Auth state, login/logout, hasPermission()
├── hooks/
│   └── useApi.ts        # useList, useFetch, useMutation
├── layouts/
│   └── AdminLayout.tsx  # Sidebar + Header + Content
├── pages/               # Mỗi module 1 folder
├── routes/index.tsx     # Router + PermissionGuard
├── types/index.ts       # TypeScript interfaces
└── utils/
    ├── format.ts        # formatDate, formatCurrency...
    └── permissions.ts   # Mã quyền constants
```

## Thêm module mới (4 bước)

1. **Type** — Thêm interface vào `src/types/index.ts`
2. **API** — Thêm 1 dòng vào `src/api/index.ts`: `export const fooApi = createCrudApi<Foo, CreateReq>('foo')`
3. **Page** — Copy bất kỳ page hiện có, đổi api/columns/fields
4. **Route + Menu** — Thêm vào `src/routes/index.tsx` và `src/layouts/AdminLayout.tsx`

## Lưu ý

- Token lưu trong sessionStorage (mất khi đóng tab). Đổi sang localStorage trong `src/api/client.ts` nếu cần.
- Tên quyền map tại `src/utils/permissions.ts` — chỉnh theo backend thực tế.
- Backend trả lỗi qua `response.data.message` — interceptor tự chuẩn hóa thành Error.message.
- Pagination chưa có ở backend — frontend load all & filter client-side, dễ nâng cấp sau.
