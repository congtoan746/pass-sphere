import { useContext, useEffect, useMemo, useState } from "react";
import { Card } from "../Card";
import { Layout } from "../Layout";
import { PlusIcon } from "../icons/Plus";
import { AuthContext } from "src/contexts/Auth";
import { createActor } from "declarations/pass_sphere_backend";
import { type Password } from "declarations/pass_sphere_backend/pass_sphere_backend.did";
import toast from "react-hot-toast";
import useDebounceEffect from "src/hooks/useDebounceEffect";
import Modal from "../Modal";
import { PasswordForm } from "../forms/PasswordForm";
import { aesGcmDecrypt, aesGcmEncrypt } from "src/utils/crypto";

export const PasswordPage = () => {
  const [passwords, setPasswords] = useState<Password[]>([]);
  const [counter, setCounter] = useState(0);

  const [currentPassword, setCurrentPassword] = useState<Password | null>(null);

  const [isAddingNewPassword, setIsAddingNewPassword] = useState(false);

  const { agent, isAuthenticated, symmetricKey } = useContext(AuthContext);

  const actor = useMemo(() => {
    return createActor(process.env.CANISTER_ID_PASS_SPHERE_BACKEND!, {
      agent,
    });
  }, [agent]);

  useDebounceEffect(
    () => {
      if (!actor || !symmetricKey) return;

      const promise = actor
        .getPasswords()
        .then((result) => {
          if ("ok" in result) {
            return result.ok;
          } else if ("err" in result) {
            throw new Error(result.err);
          }
        })
        .then((encryptedPasswords = []) => {
          return Promise.all(
            encryptedPasswords.map(async (encryptedPassword) => {
              const [name, username, password] = await Promise.all([
                aesGcmDecrypt(encryptedPassword.name, symmetricKey!),
                aesGcmDecrypt(encryptedPassword.username, symmetricKey!),
                aesGcmDecrypt(encryptedPassword.password, symmetricKey!),
              ]);

              return {
                ...encryptedPassword,
                name,
                username,
                password,
              };
            }),
          );
        })
        .then(setPasswords);

      if (counter === 0) {
        toast.promise(promise, {
          loading: "Loading passwords...",
          success: "Passwords loaded successfully",
          error: (err) => `Failed to load passwords: ${err}`,
        });
      }
    },
    500,
    [actor, symmetricKey, counter],
  );

  const handleOpenAddPasswordForm = async () => {
    setIsAddingNewPassword(true);
  };

  const handleAddPassword = async ({
    name,
    username,
    password,
  }: {
    name: string;
    username: string;
    password: string;
  }) => {
    if (!symmetricKey) {
      toast.error("Symmetric key not found");
      return;
    }
    const [encryptedUsername, encryptedName, encryptedPassword] =
      await Promise.all([
        aesGcmEncrypt(username, symmetricKey),
        aesGcmEncrypt(name, symmetricKey),
        aesGcmEncrypt(password, symmetricKey),
      ]);

    await toast.promise(
      actor.createPassword(encryptedName, encryptedUsername, encryptedPassword),
      {
        loading: "Adding password...",
        success: "Password added successfully",
        error: (err) => `Failed to add password: ${err}`,
      },
    );
    setIsAddingNewPassword(false);
    setCounter((prev) => prev + 1);
  };

  const handleUpdatePassword = async ({
    id,
    name,
    username,
    password,
  }: {
    id?: bigint;
    name: string;
    username: string;
    password: string;
  }) => {
    if (!id) return;

    if (!symmetricKey) {
      toast.error("Symmetric key not found");
      return;
    }

    const [encryptedUsername, encryptedName, encryptedPassword] =
      await Promise.all([
        aesGcmEncrypt(username, symmetricKey),
        aesGcmEncrypt(name, symmetricKey),
        aesGcmEncrypt(password, symmetricKey),
      ]);

    const promise = actor
      .updatePassword(
        id,
        encryptedName,
        encryptedUsername,
        encryptedPassword,
      )
      .then(() => {
        setCurrentPassword(null);
        setCounter((prev) => prev + 1);
      });

    toast.promise(
      promise,
      {
        loading: "Updating password...",
        success: "Password updated successfully",
        error: (err) => `Failed to update password: ${err}`,
      },
    );
  };

  const handleDeletePassword = (id: bigint) => {
    const promise = actor.deletePassword(id).then(() => {
      setCurrentPassword(null);
      setCounter((prev) => prev + 1);
    });

    toast.promise(promise, {
      loading: "Deleting password...",
      success: "Password deleted successfully",
      error: (err) => `Failed to delete password: ${err}`,
    });
  };

  return (
    <Layout>
      <Card
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1 className="title">Password List</h1>
          <p className="subtitle">List of passwords you have added</p>
        </div>
        <div>
          <button
            className="button"
            type="button"
            onClick={handleOpenAddPasswordForm}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
            }}
          >
            <PlusIcon />
            Add New Password
          </button>
        </div>
      </Card>

      <div
        style={{
          flex: 1,
          overflow: "auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gridTemplateRows: "repeat(auto-fill, 120px)",
          gap: "1rem",
          marginTop: 16,
        }}
      >
        {passwords?.map((password) => {
          return (
            <Card
              key={password.id}
              style={{
                cursor: "pointer",
              }}
              onClick={() => setCurrentPassword(password)}
            >
              <h3>{password.name}</h3>
              <p className="subtitle">{password.username}</p>
            </Card>
          );
        })}
      </div>

      {currentPassword && (
        <Modal title="Password detail" onClose={() => setCurrentPassword(null)}>
          <PasswordForm
            initialValues={currentPassword}
            onSubmit={handleUpdatePassword}
            onDelete={handleDeletePassword}
          />
        </Modal>
      )}

      {isAddingNewPassword && (
        <Modal
          title="Add new password"
          onClose={() => setIsAddingNewPassword(false)}
        >
          <PasswordForm onSubmit={handleAddPassword} />
        </Modal>
      )}
    </Layout>
  );
};
