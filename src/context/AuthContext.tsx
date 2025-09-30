import React, { createContext, useContext } from 'react';

const AuthContext = createContext({ user: true, loading: false });

export const AuthProvider = ({ children }) => (
  <AuthContext.Provider value={{ user: true, loading: false }}>
    {children}
  </AuthContext.Provider>
);

export const useAuth = () => useContext(AuthContext);

export { AuthContext };
