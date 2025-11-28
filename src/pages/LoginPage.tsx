import { googleOAuthLogin } from "../services/googleOAuthService";
import { useUserStore } from "../store/userStore";

export function LoginPage() {
  const user = useUserStore((s) => s.user);

  return (
    <div className="p-6">
      <h1>Google ile giriş yap</h1>

      <button
        onClick={async () => {
          await googleOAuthLogin();
        }}
      >
        Google ile Giriş Yap
      </button>
    </div>
  );
}
