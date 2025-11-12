import { Link } from "react-router";

const users = [
  { id: 1, name: "Alice Johnson" },
  { id: 2, name: "Bob Smith" },
  { id: 3, name: "Charlie Brown" },
];

export default function Users() {
  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-4 text-4xl font-bold">Lista de usuarios</h1>
        <p className="mb-6 text-gray-600">Ruta: /users</p>

        <div className="mb-8 space-y-4">
          {users.map((user) => (
            <div key={user.id} className="rounded border p-4 hover:bg-gray-50">
              <Link to={`/users/${user.id}`} className="font-medium text-blue-600 hover:underline">
                {user.name}
              </Link>
            </div>
          ))}
        </div>

        <div className="space-x-4">
          <Link to="/users/profile" className="text-blue-600 hover:underline">
            Ver perfil
          </Link>
          <Link to="/" className="text-blue-600 hover:underline">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
