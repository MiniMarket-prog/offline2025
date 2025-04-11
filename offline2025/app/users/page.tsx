import AppLayout from "@/components/layout/app-layout"
import CreateUserForm from "@/components/user/create-user-form"
import UserList from "@/components/user/user-list"

export default function UsersPage() {
  return (
    <AppLayout>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <CreateUserForm />
        </div>
        <div>
          <UserList />
        </div>
      </div>
    </AppLayout>
  )
}
