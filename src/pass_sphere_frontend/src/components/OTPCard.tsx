import { useEffect, useMemo, useState } from "react";
import { Card, CardProps } from "./Card";
import { TOTP } from "otpauth";

export type OTPCardProps = {
  secret: string;
  issuer: string;
  name: string;
} & CardProps;

export const OTPCard = ({
  secret,
  name,
  issuer,
  children: _,
  ...props
}: OTPCardProps) => {
  const [progress, setProgress] = useState<number>(100);
  const [token, setToken] = useState<string>("");
  const otp = useMemo(() => {
    const totp = new TOTP({
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret,
    });

    return totp;
  }, [secret]);

  useEffect(() => {
    const update = () => {
      let seconds = otp.period - (Math.floor(Date.now() / 1000) % otp.period);
      setToken(otp.generate());
      setProgress(Math.floor((seconds / otp.period) * 100));
    };

    update();

    const interval = setInterval(update, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [token, otp]);

  return (
    <Card {...props} progress={progress}>
      <h3 style={{ textAlign: "center", fontSize: 30 }}>{token}</h3>
      <p style={{textAlign: "center"}} className="subtitle">
        {name} - {issuer}
      </p>
    </Card>
  );
};
