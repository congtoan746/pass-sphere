import React, { useState } from "react";
import ReactModal from "react-modal";

const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    backgroundColor: "#101114",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "20px",
    maxWidth: "500px",
    width: "90%",
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.75)",
  },
};

ReactModal.setAppElement("#root");

type ModalProps = {
  title: string;
  children: React.ReactNode;
  onClose?: (event: unknown) => void;
};

const Modal = ({ title, children, onClose }: ModalProps) => {

  const closeModal = onClose;

  return (
    <div>
      <ReactModal
        isOpen
        onRequestClose={closeModal}
        style={customStyles}
        contentLabel={title}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2>{title}</h2>
          <button
            onClick={closeModal}
            style={{
              background: "none",
              border: "none",
              color: "white",
              cursor: "pointer",
            }}
          >
            &times;
          </button>
        </div>
        <div style={{ marginTop: "20px" }}>{children}</div>
      </ReactModal>
    </div>
  );
};

export default Modal;
