import { useContext, useMemo, useState } from "react";
import { Card } from "../Card";
import { PlusIcon } from "../icons/Plus";
import { Layout } from "../Layout";
import { type TOTP } from "declarations/pass_sphere_backend/pass_sphere_backend.did";
import { AuthContext } from "src/contexts/Auth";
import { createActor } from "declarations/pass_sphere_backend";
import useDebounceEffect from "src/hooks/useDebounceEffect";
import toast from "react-hot-toast";
import Modal from "../Modal";
import { TOTPForm } from "../forms/TOTPForm";
import * as OTPAuth from "otpauth";
import { OTPCard } from "../OTPCard";
import { aesGcmDecrypt, aesGcmEncrypt } from "src/utils/crypto";

export const TOTPPage = () => {
  const [totps, setTOTPs] = useState<TOTP[]>([]);
  const [counter, setCounter] = useState(0);

  const [currentTOTP, setCurrentTOTP] = useState<TOTP | null>(null);

  const [isAddingNewTOTP, setIsAddingNewTOTP] = useState(false);

  const { agent, symmetricKey } = useContext(AuthContext);

  const actor = useMemo(() => {
    return createActor(process.env.CANISTER_ID_PASS_SPHERE_BACKEND!, {
      agent,
    });
  }, [agent]);

  useDebounceEffect(
    () => {
      if (!actor || !symmetricKey) return;

      const promise = actor
        .getTOTPs()
        .then((result) => {
          if ("ok" in result) {
            return result.ok;
          } else if ("err" in result) {
            throw new Error(result.err);
          }
        })
        .then((encryptedTOTPs = []) => {
          return Promise.all(
            encryptedTOTPs.map(async (encryptedTOTP) => {
              const [name, username, secret] = await Promise.all([
                aesGcmDecrypt(encryptedTOTP.name, symmetricKey),
                aesGcmDecrypt(encryptedTOTP.issuer, symmetricKey),
                aesGcmDecrypt(encryptedTOTP.secret, symmetricKey),
              ]);

              return {
                ...encryptedTOTP,
                name,
                issuer: username,
                secret,
              };
            }),
          );
        })
        .then(setTOTPs);

      if (counter === 0) {
        toast.promise(promise, {
          loading: "Loading TOTPs...",
          success: "TOTPs loaded successfully",
          error: (err) => `Failed to load TOTPs: ${err}`,
        });
      }
    },
    500,
    [actor, counter],
  );

  const handleOpenAddTOTPForm = async () => {
    setIsAddingNewTOTP(true);
  };

  const handleAddTOTP = async ({
    name,
    issuer,
    secret,
  }: {
    name: string;
    issuer: string;
    secret: string;
  }) => {
    if (!symmetricKey) {
      toast.error("Symmetric key not found");
      return;
    }

    const [encryptedName, encryptedIssuer, encryptedSecret] = await Promise.all(
      [
        aesGcmEncrypt(name, symmetricKey),
        aesGcmEncrypt(issuer, symmetricKey),
        aesGcmEncrypt(secret, symmetricKey),
      ],
    );

    await toast.promise(
      actor.createTOTP(encryptedName, encryptedIssuer, encryptedSecret),
      {
        loading: "Adding TOTP...",
        success: "TOTP added successfully",
        error: (err) => `Failed to add TOTP: ${err}`,
      },
    );
    setIsAddingNewTOTP(false);
    setCounter((prev) => prev + 1);
  };

  const handleUpdateTOTP = async ({
    id,
    name,
    issuer,
    secret,
  }: {
    id?: bigint;
    name: string;
    issuer: string;
    secret: string;
  }) => {
    if (!id) return;

    if(!symmetricKey) {
      toast.error("Symmetric key not found");
      return;
    }

    const [encryptedName, encryptedIssuer, encryptedSecret] = await Promise.all(
      [
        aesGcmEncrypt(name, symmetricKey),
        aesGcmEncrypt(issuer, symmetricKey),
        aesGcmEncrypt(secret, symmetricKey),
      ],
    );

    const promise = actor
      .updateTOTP(id, encryptedName, encryptedIssuer, encryptedSecret)
      .then(() => {
        setCurrentTOTP(null);
        setCounter((prev) => prev + 1);
      });

    toast.promise(
      promise,
      {
        loading: "Updating TOTP...",
        success: "TOTP updated successfully",
        error: (err) => `Failed to update TOTP: ${err}`,
      },
    );
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
          <h1 className="title">TOTPs List</h1>
          <p className="subtitle">List of TOTP accounts you have added</p>
        </div>
        <div>
          <button
            className="button"
            onClick={handleOpenAddTOTPForm}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
            }}
          >
            <PlusIcon />
            Add New TOTP
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
        {totps?.map((totp) => {
          return (
            <OTPCard
              key={totp.id}
              secret={totp.secret}
              issuer={totp.issuer}
              name={totp.name}
              style={{
                cursor: "pointer",
              }}
              onClick={() => setCurrentTOTP(totp)}
            />
          );
        })}
      </div>

      {currentTOTP && (
        <Modal title="TOTP detail" onClose={() => setCurrentTOTP(null)}>
          <TOTPForm initialValues={currentTOTP} onSubmit={handleUpdateTOTP} />
        </Modal>
      )}

      {isAddingNewTOTP && (
        <Modal title="Add new TOTP" onClose={() => setIsAddingNewTOTP(false)}>
          <TOTPForm onSubmit={handleAddTOTP} />
        </Modal>
      )}
    </Layout>
  );
};
