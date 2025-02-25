import prisma from "lib/db";
import { LocalForm } from "@/components/form/LocalForm";
import { updateLocal } from "@/app/actions/locals";
import { getUser } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";

export default async function EditLocalPage({
  params
}: {
  params: { id: string };
}) {
  const user = await getUser();
  if (!user) {
    redirect("/");
  }

  const local = await prisma.local.findUnique({
    where: {
      id: params.id,
      userId: user.id
    }
  });

  if (!local) {
    notFound();
  }

  const handleSubmit = async (formData: FormData) => {
    "use server";
    await updateLocal(params.id, formData);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Edit Your Farm/Ranch Profile</h1>
      <LocalForm
        initialData={local}
        onSubmit={handleSubmit}
        buttonText="Save Changes"
      />
    </div>
  );
}
