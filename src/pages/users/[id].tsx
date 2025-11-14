import { Link, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";

import { Layout, ProtectedRoute } from "@/components";
import { Button, Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui";

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();

  return (
    <ProtectedRoute>
      <Layout>
        <div className="text-foreground px-5 md:px-6">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            <Button asChild variant="ghost" size="sm" className="w-fit gap-2">
              <Link to="/users">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                <span>Volver al perfil activo</span>
              </Link>
            </Button>

            <Card className="border-dashed bg-white/80">
              <CardHeader>
                <CardTitle>Información no disponible</CardTitle>
                <CardDescription>
                  {id
                    ? `El identificador ${id} no corresponde a un miembro disponible. En esta versión solo mostramos los datos del usuario autenticado.`
                    : "Solo se muestra la información del usuario autenticado en Entipedia."}
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button asChild variant="secondary">
                  <Link to="/users">Ir a mi perfil</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
