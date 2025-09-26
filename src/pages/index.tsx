// src/pages/index.tsx
import { GetServerSideProps } from "next";

export default function Home() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const hasUser = !!ctx.req.cookies?.ws_user;
  return {
    redirect: {
      destination: hasUser ? "/dashboard" : "/login", // FIX: /login (not /auth/login)
      permanent: false,
    },
  };
};
