type Data = {}
export const sameDataHandler = (data: Data, user: {}) => {

    const dataCheck = data

    type ProfilKey = keyof typeof dataCheck

    for (const key of Object.keys(dataCheck) as ProfilKey[]) {
        const value = dataCheck[key]

        if (value === undefined) continue;
        
        if (value === user[key]) {
            return { error: `${key} must be different from the current one` }
        }
    }
    return false
}
