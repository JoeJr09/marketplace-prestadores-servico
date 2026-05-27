export async function signUp(
  full_name: string,
  email: string,
  password: string,
  role: string
) {
  const response = await fetch(
    "/api/auth/register",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        full_name,
        email,
        password,
        role,
      }),
    }
  );

  return await response.json();
}

export async function signIn(
  email: string,
  password: string
) {
  const response = await fetch(
    "/api/auth/login",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    }
  );

  return await response.json();
}

export async function signOut() {
  const response = await fetch(
    "/api/auth/logout",
    {
      method: "POST",
    }
  );

  return await response.json();
}

export async function getMe() {
  const response = await fetch(
    "/api/auth/me"
  );

  return await response.json();
}