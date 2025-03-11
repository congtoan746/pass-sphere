import { useState } from "react";
import * as Yup from "yup";
import { EyeCloseIcon } from "../icons/EyeClose";
import { EyeOpenIcon } from "../icons/EyeOpen";

const schema = Yup.object().shape({
  name: Yup.string().required(),
  issuer: Yup.string().required(),
  secret: Yup.string().min(16).required(),
});

type TOTPFormProps = {
  initialValues?: {
    id?: bigint;
    name: string;
    issuer: string;
    secret: string;
  };
  onSubmit?: (values: {
    id?: bigint;
    name: string;
    issuer: string;
    secret: string;
  }) => void;
  onDelete?: (id: bigint) => void;
};

export const TOTPForm = ({
  initialValues,
  onSubmit,
  onDelete,
}: TOTPFormProps) => {
  const [isReadOnly, setIsReadOnly] = useState(() => {
    return !!initialValues?.id;
  });

  const [values, setValues] = useState({
    issuer: "",
    secret: "",
    ...initialValues,
  });

  const [isShowingSecret, setIsShowingSecret] = useState(false);

  const isFormValid = schema.isValidSync(values, { abortEarly: false });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (onSubmit && isFormValid) {
      onSubmit(values);
    }
  };

  const handleDeleteTOTP = () => {
    if (initialValues?.id && onDelete) {
      onDelete(initialValues.id);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div>
        <label htmlFor="name">Label</label>
        <input
          type="text"
          name="name"
          id="name"
          value={values.name}
          disabled={isReadOnly}
          placeholder="Input label"
          onChange={(event) => {
            setValues({
              ...values,
              name: event.target.value,
            });
          }}
        />
      </div>
      <div>
        <label htmlFor="issuer">Issuer</label>
        <input
          type="text"
          name="issuer"
          id="issuer"
          value={values.issuer}
          disabled={isReadOnly}
          placeholder="Input issuer"
          onChange={(event) => {
            setValues({
              ...values,
              issuer: event.target.value,
            });
          }}
        />
      </div>

      <div style={{ position: "relative" }}>
        <label htmlFor="secret">Secret</label>
        <input
          type={isShowingSecret ? "text" : "password"}
          name="secret"
          id="secret"
          value={values.secret}
          disabled={isReadOnly}
          placeholder="Input secret"
          onChange={(event) => {
            setValues({
              ...values,
              secret: event.target.value,
            });
          }}
        />
        <button
          type="button"
          style={{
            position: "absolute",
            right: 10,
            bottom: 8,
          }}
          onClick={() => setIsShowingSecret((prev) => !prev)}
        >
          {isShowingSecret ? <EyeCloseIcon /> : <EyeOpenIcon />}
        </button>
      </div>

      {isReadOnly ? (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="button-full"
            style={{ marginTop: 16 }}
            type="submit"
            onClick={() => setIsReadOnly(false)}
          >
            Edit
          </button>
          <button
            className="button-full button-destroy"
            style={{ marginTop: 16 }}
            type="submit"
            onClick={handleDeleteTOTP}
          >
            Delete
          </button>
        </div>
      ) : (
        <button
          className="button-full"
          style={{ marginTop: 16 }}
          type="submit"
          onClick={handleSubmit}
          disabled={!isFormValid}
        >
          {initialValues?.id ? "Update" : "Create"}
        </button>
      )}
    </div>
  );
};
