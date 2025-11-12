import { Layout, ProtectedRoute } from "@/components";
import UserProfileContent from "@/components/users/user-profile-content";

function UsersPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <UserProfileContent mode="detail" />
      </Layout>
    </ProtectedRoute>
  );
}

export default UsersPage;
