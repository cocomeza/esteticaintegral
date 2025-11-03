import { redirect } from 'next/navigation'
import { getAdminSession } from '../../lib/admin-auth'
import AdminDashboard from './components/AdminDashboard'

export default async function AdminPage() {
  const adminUser = await getAdminSession()
  
  if (!adminUser) {
    redirect('/admin/login')
  }

  return <AdminDashboard adminUser={adminUser} />
}