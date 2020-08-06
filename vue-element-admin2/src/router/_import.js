export default file => {
  return map[file] || null
}

const map = {
  Nested: () => import('@/views/layout/Layout'),
  Menu1: () => import('@/views/nested/menu1/index'),
  'Menu1-1': () => import('@/views/nested/menu1/menu1-1'),
  'Menu1-2': () => import('@/views/nested/menu1/menu1-2')
}
