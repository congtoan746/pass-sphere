import { useState } from "react";
import * as Yup from "yup";
import { EyeCloseIcon } from "../icons/EyeClose";
import { EyeOpenIcon } from "../icons/EyeOpen";

const schema = Yup.object().shape({
  name: Yup.string().required(),
  username: Yup.string().required(),
  password: Yup.string().required(),
});

type PasswordFormProps = {
  initialValues?: {
    id?: bigint;
    name: string;
    username: string;
    password: string;
  };
  onSubmit?: (values: {
    id?: bigint;
    name: string;
    username: string;
    password: string;
  }) => void;
  onDelete?: (id: bigint) => void;
};

export const PasswordForm = ({
  initialValues,
  onSubmit,
  onDelete,
}: PasswordFormProps) => {
  const [isReadOnly, setIsReadOnly] = useState(() => {
    return !!initialValues?.id;
  });

  const [values, setValues] = useState({
    name: "",
    username: "",
    password: "",
    ...initialValues,
  });

  const [isShowingPassword, setIsShowingPassword] = useState(false);

  const isFormValid = schema.isValidSync(values, { abortEarly: false });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (onSubmit && isFormValid) {
      onSubmit(values);
    }
  };

  const handleDeletePassword = () => {
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
        <label htmlFor="name">Name</label>
        <input
          type="text"
          name="name"
          id="name"
          value={values.name}
          placeholder="Input name"
          disabled={isReadOnly}
          onChange={(event) => {
            setValues({
              ...values,
              name: event.target.value,
            });
          }}
        />
      </div>
      <div>
        <label htmlFor="username">Username</label>
        <input
          type="text"
          name="username"
          id="username"
          value={values.username}
          disabled={isReadOnly}
          placeholder="Input username"
          onChange={(event) => {
            setValues({
              ...values,
              username: event.target.value,
            });
          }}
        />
      </div>

      <div style={{ position: "relative" }}>
        <label htmlFor="password">Password</label>
        <input
          type={isShowingPassword ? "text" : "password"}
          name="password"
          id="password"
          value={values.password}
          disabled={isReadOnly}
          placeholder="Input password"
          onChange={(event) => {
            setValues({
              ...values,
              password: event.target.value,
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
          onClick={() => setIsShowingPassword((prev) => !prev)}
        >
          {isShowingPassword ? <EyeCloseIcon /> : <EyeOpenIcon />}
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
            onClick={handleDeletePassword}
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
        >
          {initialValues?.id ? "Update" : "Create"}
        </button>
      )}
    </div>
  );
};
