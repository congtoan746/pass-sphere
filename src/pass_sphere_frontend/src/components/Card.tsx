import { clsx } from "clsx";
import { HTMLProps } from "react";

export type CardProps = {
  children?: React.ReactNode;
  progress?: number;
} & HTMLProps<HTMLDivElement>;

export const Card = ({
  children,
  className,
  progress,
  style,
  ...props
}: CardProps) => {
  return (
    <div
      className={clsx("card", progress && "progress", className)}
      style={{
        ...(progress
          ? {
              "--progress": `${progress}%`,
            }
          : {}),
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};
