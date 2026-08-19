(() => {
  async function isLoggedIn() {
    const { data, error } = await IEMSupabase.auth.getSession();
    if (error) return false;
    return Boolean(data.session);
  }

  async function login(email, password) {
    const { data, error } = await IEMSupabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    });

    if (error) throw error;
    return Boolean(data.session);
  }

  async function logout() {
    await IEMSupabase.auth.signOut();
    window.location.href = 'admin-login.html';
  }

  async function requireLogin() {
    const loggedIn = await isLoggedIn();
    if (!loggedIn) {
      window.location.replace('admin-login.html');
      return false;
    }
    document.documentElement.classList.add('admin-authenticated');
    return true;
  }

  window.IEMAdminAuth = { login, logout, isLoggedIn, requireLogin };
})();
