import { createContext, useContext } from 'react'
export const StaffCtx = createContext({ authed: false, loading: true })
export const useStaff = () => useContext(StaffCtx)
